/*
 HD Dj-Control
 
 created 2012
 by robelix <roland@robelix.com>
 
 Licence: Creative Commons CC-BY-SA 3.0
 
*/


#include <Encoder.h>
#include <MIDI.h>



// MIDI //
#define MIDI_LISTEN_CHANNEL  5
#define MIDI_BUTTON_CHANNEL  1
#define MIDI_FADER_CHANNEL   2
#define MIDI_ENCODER_CHANNEL 3



// BUTTONS //

// button pins
#define NR_OF_BUTTONS 16
const int pinButton[NR_OF_BUTTONS] = {38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53};
// button last states
int buttonState[NR_OF_BUTTONS]      = {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0};
// button last change time for debounce
long buttonDebounce[NR_OF_BUTTONS]  = {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0};
#define BUTTON_DEBOUNCE_DELAY 100


// LEDS //

const int ledL1 =  2;      // the number of the LED pin
const int ledR1 =  3;

#define NR_OF_LEDS 4
#define LED_L_PLAY 2
#define LED_R_PLAY 3
#define LED_L_CUE 4
#define LED_R_CUE 5

const int ledPins[NR_OF_LEDS] = {LED_L_PLAY, LED_R_PLAY, LED_L_CUE, LED_R_CUE};


// FADER & POTIS //

#define NR_OF_FADERS 11
const int pinFader[NR_OF_FADERS] = { A0,A1,A2,A3,A4,A5,A6,A7,A8,A9,A10 };
int faderState[NR_OF_FADERS] = {0,0,0,0,0,0,0,0,0,0,0};
#define FADER_CHANGE_MIN 8



// ENCODER //

#define ENCODER_L_PIN_A 18
#define ENCODER_L_PIN_B 16

#define ENCODER_R_PIN_A 19
#define ENCODER_R_PIN_B 17

volatile byte encoderLPos = 0;
volatile byte encoderRPos = 0;

volatile unsigned long encoderLtstamp = 0;
volatile unsigned long encoderRtstamp = 0;

Encoder leftEncoder(ENCODER_L_PIN_A, ENCODER_L_PIN_B);
Encoder rightEncoder(ENCODER_R_PIN_A, ENCODER_R_PIN_B);



void setup() {

  // MIDI Setup
  MIDI.begin(MIDI_LISTEN_CHANNEL);
  Serial.begin(115200);
  MIDI.setHandleNoteOn(handleNoteOn);
  MIDI.setHandleNoteOff(handleNoteOff);
    
  // initialize the LEDs pin as an output:
  for(int i=0; i<NR_OF_LEDS; i++) {
    pinMode(ledPins[i], OUTPUT);
  };
  pinMode(13,OUTPUT);
  
  // initialize the pushbutton pins as an input:
  for(int i=0; i<NR_OF_BUTTONS; i++) {
    pinMode(pinButton[i], INPUT);
  }
};


void loop(){
  checkEncoders();
  checkButtons();
  checkFaders();
  MIDI.read();
};



void handleNoteOn(byte channel, byte note, byte velocity) {
    if (note >1 && note < 6) {
      digitalWrite(note, HIGH);
    }
}



void handleNoteOff(byte channel, byte note, byte velocity) {
    if (note >1 && note < 6) {
      digitalWrite(note, LOW);
    }
}



void checkEncoders() {
  byte newPos = leftEncoder.read();
  if (newPos != encoderLPos) {
    MIDI.sendControlChange(1, byte( newPos % 128 ), MIDI_ENCODER_CHANNEL); 
    encoderLPos = newPos;
  }
  newPos = rightEncoder.read();
  if (newPos != encoderRPos) {
    MIDI.sendControlChange(2, byte(newPos % 128 ), MIDI_ENCODER_CHANNEL);
    encoderRPos = newPos;
  }
}



void checkFaders() {
  for( int i=0; i<NR_OF_FADERS; i++ ) {
    checkFader(i);
  }
}



void checkButtons() {
  for( int i=0; i<NR_OF_BUTTONS; i++ ) {
    checkButton(i);
  }
};



void checkFader(int i) {
  int fdrValue = analogRead(pinFader[i]);
  if( fdrValue != faderState[i] ) {
    if( abs(fdrValue - faderState[i]) > FADER_CHANGE_MIN) {
      MIDI.sendControlChange(byte(i), byte(fdrValue/8), MIDI_FADER_CHANNEL); // value bis 127
      faderState[i] = fdrValue;
    }
  }
}



void checkButton(int i) {
  int btnValue = digitalRead(pinButton[i]);
  
    //debounce 
  if (btnValue != buttonState[i]) {
    long now = millis();
    if ( (now - buttonDebounce[i]) > BUTTON_DEBOUNCE_DELAY) {
      buttonDebounce[i] = now;
    } else {
      // zu früh reset state
      btnValue = buttonState[i];
    }
  }
  
  if ( btnValue != buttonState[i]) {
    if (btnValue == HIGH) {
      MIDI.sendNoteOn(byte(i), 1, MIDI_BUTTON_CHANNEL);
    } else {
      MIDI.sendNoteOff(byte(i), 1, MIDI_BUTTON_CHANNEL);
    }
    buttonState[i] = btnValue;
  }

}

