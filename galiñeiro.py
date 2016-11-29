#!/usr/bin/python2.7
# -*- coding: utf-8 -*-

import RPi.GPIO as GPIO # importamos libreria entradas-salidas
import time # importamos libreria temporizadores
from flask import Flask, jsonify, render_template # servicio WEB
#import pygame, sys	# Chamadas do sistema
#from pygame.locals import * # Aplicación para as fotos da camara
#import pygame.camera	# Funcions para manejar webcam
import threading # Libreria de fios (semaforo)
import subprocess
import os

#establecemos sistema de numeracion
GPIO.setmode(GPIO.BCM)

#Configuramos salidas
GPIO.setup(4, GPIO.OUT) # Lampara Incandescente Cortello
GPIO.output(4, True)
GPIO.setup(15, GPIO.OUT) # Alimentación Transformado 24 V CC
GPIO.output(15, True)
GPIO.setup(18, GPIO.OUT) # - 0 V CC Motor Puerta
GPIO.output(18, True)
GPIO.setup(23, GPIO.OUT) # + 24 V CC Motor Puerta (SEMTIDO 1)
GPIO.output(23, True)
GPIO.setup(24, GPIO.OUT) # + 24 V CC Motor Puerta (Sentido 2)
GPIO.output(24, True)
GPIO.setup(25, GPIO.OUT) # Luz Pulsador MAN/AUTO
GPIO.output(25, True)

#Configuramos entradas
GPIO.setup(20, GPIO.IN, pull_up_down=GPIO.PUD_UP) # Pulsador
GPIO.setup(16, GPIO.IN, pull_up_down=GPIO.PUD_UP) # Noche
GPIO.setup(12, GPIO.IN,	pull_up_down=GPIO.PUD_UP) # Dia

#DECLARAMOS VARIABLES
porta = 0
Incandescente = 0
IncandescenteMovil = 0
Pulsador = 0
manAuto = 0 # 0: Automatico 1: Manual
cerreManual = 0 #Evitar a espera de 20 minutos se xa foi feita no peche
CandadoAbrirCerrarPorta = threading.Lock()	# SEMAFORO
CandadoPrograma = threading.Lock()	# SEMAFORO

#Funciones predifinidas

app = Flask(__name__) # Acceso rapido de funcions

# WEBCAM
@app.route('/galinheiro/snapshot', methods=['GET']) #URL FUNCION
def Camara():
    cameraProcess = subprocess.Popen("fswebcam -d /dev/video0 -i gspca_zc3xx -r 320x232 -S 10 --jpeg 80 --no-banner --save /var/www/html/snapshot.jpg".split());
    cameraProcess.wait()

    """
    pygame.init()
    pygame.camera.init()

    cam = pygame.camera.Camera("/dev/video0",(320,240),"RGB")
    cam.start()

    image = cam.get_image()
    pygame.image.save(image, "/var/www/html/snapshot.jpg")
    cam.stop()
    """

    return jsonify({"boolean":1})

# ENCENDER INCANDESCENTE
def Encender_Incandescente(dispositivo):
    global Incandescente
    global IncandescenteMovil

    GPIO.output(4, False) # Encender luz
    IncandescenteMovil = 1

    print "Encender", dispositivo

@app.route('/galinheiro/encender_incandescente/', methods=['GET'])
def Encender_Incandescente_Movil():
    global Incandescente
    global IncandescenteMovil

    if Incandescente == 0:
        Encender_Incandescente(1)

    return jsonify({"incandescente": IncandescenteMovil})

# APAGAR INCANDESCENTE
def Apagar_Incandescente(dispositivo):
    global Incandescente
    global IncandescenteMovil

    GPIO.output(4, True) # Encender luz
    IncandescenteMovil = 0

    print "Apagar", dispositivo


@app.route('/galinheiro/apagar_incandescente/', methods=['GET'])
def Apagar_Incandescente_Movil():
    global Incandescente
    global IncandescenteMovil

    if Incandescente == 0:
        Apagar_Incandescente(1)

    return jsonify({"incandescente": IncandescenteMovil})

# ABRIR PORTA
def Abrir_Porta(dispositivo):
    global porta

    CandadoAbrirCerrarPorta.acquire()
    porta = 1
    print "Abrir", dispositivo
    GPIO.output(15, False) # Alimentar Fuente
    time.sleep(1)
    GPIO.output(24, False) # Alimentamos Motor (Sentido 2)
    time.sleep(22)
    GPIO.output(15, True)	# Desconectamos Fuente
    GPIO.output(24, True)	# Desconectamos Motor
    CandadoAbrirCerrarPorta.release()

@app.route('/galinheiro/abrir_porta/', methods=['GET'])
def Abrir_Porta_Movil():
    global Pulsador
    global manAuto
    global porta

    if Pulsador == 0 and manAuto == 1:
        if porta == 0:
            Abrir_Porta(1)
        return jsonify({"codigo": True})
    else:
        return jsonify({"codigo": False})

def Cerrar_Porta(dispositivo):
    global porta

    CandadoAbrirCerrarPorta.acquire()
    porta = 0
    print "Cerrar", dispositivo
    GPIO.output(15, False) # Alimentar Fuente
    time.sleep(1)
    GPIO.output(18, False) # Alimentamos - 0 V CC
    time.sleep(1)
    GPIO.output(23, False)	# Alimentamos Motor (Sentido 1)
    time.sleep(22)
    GPIO.output(15, True)	# Desconectamos Fuente
    GPIO.output(23, True)	# Desconectamos Motor
    time.sleep(1)
    GPIO.output(18, True)	# Desconectamos -0V CC
    CandadoAbrirCerrarPorta.release()

@app.route('/galinheiro/cerrar_porta/', methods=['GET'])
def Cerrar_Porta_Movil():
    global Pulsador
    global manAuto
    global porta

    if Pulsador == 0 and manAuto == 1:
        if porta == 1:
            Cerrar_Porta(1)
        return jsonify({"codigo": True})
    else:
        return jsonify({"codigo": False})

def Encender_Luz_Estado_Pulsador():
    GPIO.output(15, False)
    time.sleep(1)
    GPIO.output(25, False)

def Apagar_Luz_Estado_Pulsador():
    GPIO.output(15, True)
    GPIO.output(25, True)

@app.route('/galinheiro/parametros', methods=['GET'])
def Parametros():
    global porta
    global manAuto
    global IncandescenteMovil

    return jsonify({"porta": porta, "manAuto": manAuto, "incandescente": IncandescenteMovil})

@app.route('/galinheiro/automatico_manual/<int:estado>', methods=['GET'])
def Automatico_Manual(estado):
    global Pulsador
    global manAuto

    if Pulsador == 0:
        manAuto = estado

    return jsonify({"manAuto": manAuto})


def fioManAuto():
    global manAuto

    while True:
        tempo = 0
        while manAuto == 0:
            time.sleep(10)

        while manAuto == 1 and tempo < 600:
            time.sleep(1)
            tempo += 1

        manAuto = 0

@app.route("/")
def hello():
    return render_template('index.html')

@app.route('/galinheiro/', methods=['GET'])
def Programa():
    CandadoPrograma.acquire()
    global Pulsador
    global manAuto
    global Incandescente
    global cerreManual

    fioEstadoManAuto = threading.Thread(target=fioManAuto)
    fioEstadoManAuto.start()

    Cerrar_Porta(0) # Cerramos portal como primeira instrucción para determinar a posición do portal

    while True:		# Bucle de funcionamento do Programa
    	# CICLO MANUAL
        """
        if GPIO.input(20) == False and Pulsador == 0:
            print "Manual 1"
            Pulsador = 1
            manAuto = 0 #Prioriza o pulsador cuadro sobre mobil
            Encender_Luz_Estado_Pulsador()
            if porta == 0:
                Abrir_Porta(0)

        if GPIO.input(20) == False and Pulsador == 1:
            print "Manual 2"
            Pulsador = 2
            Incandescente = 1
            Encender_Incandescente(0)
            while GPIO.input(20) == False:
                continue

        if GPIO.input(20) == False and Pulsador == 2:
            print "Automatico"
            Apagar_Incandescente(0)
            Incandescente = 0
            Apagar_Luz_Estado_Pulsador()
            Pulsador = 0
            while GPIO.input(20) == False:
                continue
        """
        
        if Pulsador == 0 and manAuto == 0: # CICLO AUTOMATICO
            if GPIO.input(16) == False and porta == 1: # Cerrar Porta Noite
                Incandescente = 1
                if cerreManual == 1:
                    Encender_Incandescente(0)
                    time.sleep(1200)
                    cerreManual = 0
                Cerrar_Porta(0)
                Apagar_Incandescente(0)
                Incandescente = 0

        if GPIO.input(12) == False and porta == 0: # Abrir Porta Día
            Abrir_Porta(0)
            cerreManual = 1

    Candado2.release()

if __name__ == '__main__':					# Indica si se esta cargando desde un arquivo principal ou é un modulos esterno
    app.run(host='0.0.0.0', debug=True, threaded=True)
