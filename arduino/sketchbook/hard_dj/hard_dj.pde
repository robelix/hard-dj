/*
 HD Dj-Control
 
 created 2012
 by robelix <roland@robelix.com>
 
 Licence: Creative Commons CC-BY-SA 3.0
 
 for Arduino Mega 2560
 
*/


// Libs //

#define ENCODER_OPTIMIZE_INTERRUPTS
#include <Encoder.h>
#include <MIDI.h>



// MIDI //

#define MIDI_LISTEN_CHANNEL  4
#define MIDI_BUTTON_CHANNEL  1
#define MIDI_FADER_CHANNEL   2
#define MIDI_ENCODER_CHANNEL 3

#define NOTE_VU_DECK_LEFT    100
#define NOTE_VU_DECK_RIGHT   101
#define NOTE_VU_MASTER_LEFT  102
#define NOTE_VU_MASTER_RIGHT 103



// BUTTONS //

#define KEYMATRIX_ROWS 4
#define KEYMATRIX_COLS 4
#define KEYMATRIX_DEBOUNCE 4

byte keymatrixRowPins[KEYMATRIX_ROWS] = {22, 24, 26, 28};
byte keymatrixColPins[KEYMATRIX_COLS] = {23, 25, 27, 29};

boolean keymatrixStates[KEYMATRIX_ROWS][KEYMATRIX_COLS];
unsigned long keymatrixDebounce[KEYMATRIX_ROWS][KEYMATRIX_COLS];



// LEDS //

//Pin connected to latch pin (ST_CP) of 74HC595
#define LEDS_LATCH_PIN 51
//Pin connected to clock pin (SH_CP) of 74HC595
#define LEDS_CLOCK_PIN 52
////Pin connected to Data in (DS) of 74HC595
#define LEDS_DATA_PIN 53
// nr of shift registers
#define LEDS_NR_OF_74HC595 2

byte ledsData[LEDS_NR_OF_74HC595];
boolean ledsDataChanged = false;



// VU //

//Pin connected to latch pin (ST_CP) of 74HC595
#define VU_LATCH_PIN 8
//Pin connected to clock pin (SH_CP) of 74HC595
#define VU_CLOCK_PIN 22
////Pin connected to Data in (DS) of 74HC595
#define VU_DATA_PIN 24

char vuString[2];

#define VU_PWM_PIN_G 12
#define VU_PWM_PIN_R 13
#define VU_PWM_PIN_B 0



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

  // LEDs    
  pinMode(LEDS_LATCH_PIN, OUTPUT);
  pinMode(LEDS_CLOCK_PIN, OUTPUT);  
  pinMode(LEDS_DATA_PIN, OUTPUT);
  for (int i=0; i < LEDS_NR_OF_74HC595; i++) {
    ledsData[i] = 0;
  }
  
  // init vu
  pinMode(VU_LATCH_PIN, OUTPUT);
  pinMode(VU_DATA_PIN, OUTPUT);  
  pinMode(VU_CLOCK_PIN, OUTPUT);
  pinMode(VU_PWM_PIN_R, OUTPUT);
  pinMode(VU_PWM_PIN_G, OUTPUT);

  // testing vu
  analogWrite(VU_PWM_PIN_R, 255);
  analogWrite(VU_PWM_PIN_G, 255);
  
  // keymatrix
  initKeymatrix();
};



void loop(){
  checkEncoders();
  readKeymatrix();
  checkFaders();
  MIDI.read();
  shiftOutLEDS();
};



void handleNoteOn(byte channel, byte note, byte velocity) {
    if (note/8 < LEDS_NR_OF_74HC595 ) {
      writeLED(note,HIGH);
    }
    if(note == NOTE_VU_DECK_LEFT) {
        setVU(velocity);
    }
}



void handleNoteOff(byte channel, byte note, byte velocity) {
    if (note/8 < LEDS_NR_OF_74HC595 ) {
      writeLED(note,LOW);
    }
}


void writeLED(byte ledNr, byte highlow) {
  byte chipNr = ledNr/8;
  byte pinNr = ledNr%8;
  if(chipNr < LEDS_NR_OF_74HC595) {
    bitWrite(ledsData[chipNr], pinNr, highlow);
    ledsDataChanged = true;
  }
}


void shiftOutLEDS() {
  if (ledsDataChanged) {
    digitalWrite(LEDS_LATCH_PIN, LOW);
    // shift out in reverse order
    for(int i = LEDS_NR_OF_74HC595-1; i>=0; i--) {
      shiftOut(LEDS_DATA_PIN, LEDS_CLOCK_PIN, MSBFIRST, ledsData[i]);
    }
  }
  digitalWrite(LEDS_LATCH_PIN, HIGH);
  ledsDataChanged = false;
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



void initKeymatrix() {
  
  // clear arrays
  for (byte r=0; r<KEYMATRIX_ROWS; r++) {
    for (byte c=0; c<KEYMATRIX_COLS; c++) {
      keymatrixStates[r][c]=0;
      keymatrixDebounce[r][c]=0;
    }
  }
  
  //configure column pin modes and states
  for (byte c=0; c<KEYMATRIX_COLS; c++) {
      pinMode(keymatrixColPins[c],OUTPUT);
      digitalWrite(keymatrixColPins[c],LOW);
  }
  
  //configure row pin modes and states
  for (byte r=0; r<KEYMATRIX_ROWS; r++) {
      pinMode(keymatrixRowPins[r],INPUT);
      digitalWrite(keymatrixRowPins[r],HIGH);	// Enable the internal 20K pullup resistors for each row pin.
  }
  
}


void readKeymatrix() {
  
  // run through cols
  for( int c=0; c<KEYMATRIX_COLS; c++) {
    digitalWrite(keymatrixColPins[c], LOW);
    
    // check rows
    for( int r=0; r<KEYMATRIX_ROWS; r++) {
      boolean currentValue = (digitalRead(keymatrixRowPins[r])<1);
      if (currentValue != keymatrixStates[r][c]) {

        // debounce
        unsigned long currentTime = millis();
        if(currentTime-KEYMATRIX_DEBOUNCE > keymatrixDebounce[r][c]) {
          
          int keyNr = r*KEYMATRIX_COLS+c;
          sendKeyMessage(keyNr, currentValue);
          keymatrixStates[r][c] = currentValue;
          keymatrixDebounce[r][c] = currentTime;
        }
      }
    }

    // reset col
    digitalWrite(keymatrixColPins[c], HIGH);
  }

};


void sendKeyMessage(int keyNr, boolean value) {
  if (value) {
    MIDI.sendNoteOn(byte(keyNr), 1, MIDI_BUTTON_CHANNEL);
  } else {
    MIDI.sendNoteOff(byte(keyNr), 1, MIDI_BUTTON_CHANNEL);
  }
}



void checkFader(int i) {
  int fdrValue = analogRead(pinFader[i]);
  if( fdrValue != faderState[i] ) {
    if( abs(fdrValue - faderState[i]) > FADER_CHANGE_MIN) {
      MIDI.sendControlChange(byte(i), byte(fdrValue/8), MIDI_FADER_CHANNEL); // value bis 127
      faderState[i] = fdrValue;
    }
  }
}




// This method sends bits to the shift registers:
void setVU(int value) {
  value = value-1;
  // the bits you want to send. Use an unsigned int,
  // so you can use all 16 bits:
  unsigned int bitsToSend = 0;    

  // turn off the output so the pins don't light up
  // while you're shifting bits:
  digitalWrite(VU_LATCH_PIN, LOW);

  // turn on the next highest bit in bitsToSend:
  int i = 0;
  while (i <= value) {
    bitWrite(bitsToSend, i, HIGH);
    i++;
  }

  // break the bits into two bytes, one for 
  // the first register and one for the second:
  byte registerOne = highByte(bitsToSend);
  byte registerTwo = lowByte(bitsToSend);

  // shift the bytes out:
  shiftOut(VU_DATA_PIN, VU_CLOCK_PIN, MSBFIRST, registerOne);
  shiftOut(VU_DATA_PIN, VU_CLOCK_PIN, MSBFIRST, registerTwo);

  // turn on the output so the LEDs can light up:
  digitalWrite(VU_LATCH_PIN, HIGH);
}

