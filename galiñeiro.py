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
from datetime import datetime

#modulos propios
import auth

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
CandadoCamara = threading.Lock() #SEMAFORO
CandadoPrograma = threading.Lock()	# SEMAFORO

#Funciones predifinidas

app = Flask(__name__) # Acceso rapido de funcions

# REINICIAR
@app.route('/galinheiro/reiniciar', methods=['GET']) #URL FUNCION
def Reiniciar():
    os.system("/home/pi/reiniciar.sh")

    return jsonify({"boolean": 1})

# WEBCAM
@app.route('/galinheiro/snapshot', methods=['GET']) #URL FUNCION
def Camara():
    CandadoCamara.acquire()
    cameraProcess = subprocess.Popen("fswebcam -d /dev/video0 -i gspca_zc3xx -r 320x232 -S 10 --jpeg 80 --no-banner --save /var/www/html/snapshot.jpg".split());
    cameraProcess.wait()
    CandadoCamara.release()

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

    if Pulsador == 0: # Se esta manual no galiñeiro non se apaga a fonte (Bombilla pulsador encendida)
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

    if Pulsador == 0: # Se esta manual no galiñeiro non se apaga a fonte (Bombilla pulsador encendida)
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
@auth.require
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
    horaApertura = datetime.strptime("11:00:00", "%X").time()
    horaPeche = datetime.strptime("23:00:00", "%X").time()
    
    while True:		# Bucle de funcionamento do Programa
    	# CICLO MANUAL
        if GPIO.input(20) == False:
            time.sleep(0.2)
            if GPIO.input(20) == False:
                if Pulsador == 0:
                    print "Manual 1"
                    Pulsador = 1
                    manAuto = 0 #Prioriza o pulsador cuadro sobre mobil
                    Encender_Luz_Estado_Pulsador()
                    Incandescente = 1
                    Encender_Incandescente(0)
                    if porta == 0:
                        Abrir_Porta(0)

                elif Pulsador == 1:
                    print "Automatico"
                    Apagar_Incandescente(0)
                    Incandescente = 0
                    Apagar_Luz_Estado_Pulsador()
                    Pulsador = 0

            while GPIO.input(20) == False:
                continue

        if Pulsador == 0 and manAuto == 0: # CICLO AUTOMATICO
            horaActual = datetime.now().time()
            
            if (GPIO.input(16) == False or horaActual > horaPeche) and porta == 1: # Cerrar Porta Noite
                Incandescente = 1
                if cerreManual == 1:
                    Encender_Incandescente(0)
                    time.sleep(1200)
                    cerreManual = 0
                Cerrar_Porta(0)
                Apagar_Incandescente(0)
                Incandescente = 0

            if (GPIO.input(12) == False or horaActual > horaApertura) and porta == 0: # Abrir Porta Día
                Abrir_Porta(0)
                cerreManual = 1

    CandadoPrograma.release()


#-------------------------------------------------------------------------
# VideoVixilancia
#-------------------------------------------------------------------------

@app.route('/videovixilancia/activar_grabacion', methods=['GET'])
def Activar_Videovixilancia():
    process = subprocess.Popen(['/usr/local/etc/motion/scriptMotion.sh', '0'], stdout=subprocess.PIPE)
    process.wait()
    
    return jsonify({"codigo": True})
    
    
@app.route('/videovixilancia/desactivar_grabacion', methods=['GET'])
def Desactivar_Videovixilancia():
    process = subprocess.Popen(['/usr/local/etc/motion/scriptMotion.sh', '1'], stdout=subprocess.PIPE)
    process.wait()
    
    return jsonify({"codigo": True})
    
@app.route('/videovixilancia/activar_mostrar', methods=['GET'])
def Activar_Videovixilancia_Mostrar():
    process = subprocess.Popen(['/usr/local/etc/motion/scriptMotionOnlyShow.sh', '0'], stdout=subprocess.PIPE)
    process.wait()
    
    return jsonify({"codigo": True})
    
@app.route('/videovixilancia/desactivar_mostrar', methods=['GET'])
def Desactivar_Videovixilancia_Mostrar():
    process = subprocess.Popen(['/usr/local/etc/motion/scriptMotionOnlyShow.sh', '1'], stdout=subprocess.PIPE)
    process.wait()
    
    return jsonify({"codigo": True})
    
    
@app.route('/videovixilancia/parametros', methods=['GET'])
def Parametros_Videovixilancia():
    process = subprocess.Popen(['/usr/local/etc/motion/scriptMotionOnlyShow.sh', '3'], stdout=subprocess.PIPE)
    process.wait()
    output = process.communicate()

    motionSoloMostrar = int(output[0])

    process2 = subprocess.Popen(['/usr/local/etc/motion/scriptMotion.sh', '3'], stdout=subprocess.PIPE)
    process2.wait()
    output = process2.communicate()

    motionGrabar = int(output[0])

    return jsonify({"motionSoloMostrar": motionSoloMostrar, "motionGrabar": motionGrabar })
    
    
    

if __name__ == '__main__':					# Indica si se esta cargando desde un arquivo principal ou é un modulos esterno
    app.run(host='0.0.0.0', debug=True, threaded=True)
