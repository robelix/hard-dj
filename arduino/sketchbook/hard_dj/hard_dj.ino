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

#define NOTE_VU_DECK_LEFT   119
#define NOTE_VU_DECK_RIGHT  120
#define NOTE_VU_MASTER_L    121
#define NOTE_VU_MASTER_R    122
#define NOTE_CASE_LEDS      123



// BUTTONS //

#define KEYMATRIX_ROWS 10
#define KEYMATRIX_COLS 4
#define KEYMATRIX_DEBOUNCE 4

byte keymatrixRowPins[KEYMATRIX_ROWS] = {22, 24, 26, 28, 30, 32, 34, 31, 33, 35};
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
#define LEDS_NR_OF_74HC595 5

byte ledsData[LEDS_NR_OF_74HC595];
boolean ledsDataChanged = false;

#define PIN_PWM_CASE_LEDS 13



// VU //

// VU Numbers
#define VU_MASTER_LEFT 0
#define VU_MASTER_RIGHT 1
#define VU_DECK_LEFT 2
#define VU_DECK_RIGHT 3

//Pins connected to latch pin (ST_CP) of 74HC595
const int VU_LATCH_PINS[4] = {49,43,39,38};
//Pins connected to clock pin (SH_CP) of 74HC595
const int VU_CLOCK_PINS[4] = {50,47,41,40};
////Pins connected to Data in (DS) of 74HC595
const int VU_DATA_PINS[4]  = {48,42,37,36};

// VU RGB Pins
const int VU_PWM_PINS_R[4] = {45,8,2,5};
const int VU_PWM_PINS_G[4] = {44,9,3,6};
const int VU_PWM_PINS_B[4] = {46,10,4,7};

// VU Mode
int vuMode[4] = {0,0,0,0};

// VU Data
byte vuData[4][2] = { {0,0}, {0,0}, {0,0}, {0,0} };

// RGB Colors for Master VU dependent on value
int masterColors[12][3] = {
  {0,0,255}, 
  {0,55,200},
  {0,100,155},
  {0,200,55},
  {0,255,0},
  {0,255,0},
  {0,255,0},
  {0,255,0},
  {50,200,0},
  {100,155,0},
  {200,55,0},
  {255,0,0}
};


// FADER & POTIS //

#define NR_OF_FADERS 11
const int pinFader[NR_OF_FADERS] = { A0,A1,A2,A3,A4,A5,A6,A7,A8,A9,A10 };
int faderState[NR_OF_FADERS] = {0,0,0,0,0,0,0,0,0,0,0};
#define FADER_CHANGE_MIN 8

// Fader Numbers
#define FADER_CROSSFADER 10
#define FADER_MASTER_LEFT 8
#define FADER_GAIN_LEFT 3
#define FADER_HIGH_LEFT 2
#define FADER_MID_LEFT 1
#define FADER_BASS_LEFT 0
#define FADER_MASTER_RIGHT 9
#define FADER_GAIN_RIGHT 7
#define FADER_HIGH_RIGHT 6
#define FADER_MID_RIGHT 5
#define FADER_BASS_RIGHT 4



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
  pinMode(LEDS_DATA_PIN,  OUTPUT);
  for (int i=0; i < LEDS_NR_OF_74HC595; i++) {
    ledsData[i] = 0;
  }
  pinMode(PIN_PWM_CASE_LEDS, OUTPUT);
  
  // init vu
  for (int i=0; i<4; i++) {
    pinMode(VU_LATCH_PINS[i], OUTPUT);
    pinMode(VU_DATA_PINS[i],  OUTPUT);  
    pinMode(VU_CLOCK_PINS[i], OUTPUT);
    pinMode(VU_PWM_PINS_R[i], OUTPUT);
    pinMode(VU_PWM_PINS_G[i], OUTPUT);
    pinMode(VU_PWM_PINS_B[i], OUTPUT);
    
    // testing vu - all to halft bright
    analogWrite(VU_PWM_PINS_R[i], 127);
    analogWrite(VU_PWM_PINS_G[i], 127);
    analogWrite(VU_PWM_PINS_B[i], 127);
    
    setVU(0,i);
  }

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
    else if(note == NOTE_VU_DECK_LEFT) {
      setVU(velocity, VU_DECK_LEFT);
    }
    else if(note == NOTE_VU_DECK_RIGHT) {
      setVU(velocity, VU_DECK_RIGHT);
    }
    else if(note == NOTE_VU_MASTER_L) {
      setVU(velocity, VU_MASTER_LEFT);
    }
    else if(note == NOTE_VU_MASTER_R) {
      setVU(velocity, VU_MASTER_RIGHT);
    }
    else if(note == NOTE_CASE_LEDS) {
      setCaseLeds(velocity);
    }
}


void handleNoteOff(byte channel, byte note, byte velocity) {
    if (note/8 < LEDS_NR_OF_74HC595 ) {
      writeLED(note,LOW);
    }
}


void setCaseLeds(byte value) {
  analogWrite(PIN_PWM_CASE_LEDS, value*2);
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

      // VU color changes
      switch (i) {
        case FADER_BASS_LEFT:
          setVuR( byte(fdrValue/4), VU_DECK_LEFT);
        break;
        
        case FADER_MID_LEFT:
          setVuG( byte(fdrValue/4), VU_DECK_LEFT);
        break;
        
        case FADER_HIGH_LEFT:
          setVuB( byte(fdrValue/4), VU_DECK_LEFT);
        break;
        
        case FADER_BASS_RIGHT:
          setVuR( byte(fdrValue/4), VU_DECK_RIGHT);
        break;
        
        case FADER_MID_RIGHT:
          setVuG( byte(fdrValue/4), VU_DECK_RIGHT);
        break;
        
        case FADER_HIGH_RIGHT:
          setVuB( byte(fdrValue/4), VU_DECK_RIGHT);
        break;
      }
    }
  }
}
    




// set vu meter
void setVU(int value, int vuNr) {
  value = value-1;
  for (int i=0; i < 12; i++) {
    if (i<= value) {
      writeVuLED(i, HIGH, vuNr);
    } else {
      writeVuLED(i, LOW, vuNr);
    }
  }
  shiftOutVu(vuNr);
  if (vuNr == VU_MASTER_LEFT || vuNr == VU_MASTER_RIGHT) {
    setVuRGBbyValue(value, vuNr);
  } 
}

void setVuRGBbyValue(int value, int vuNr) {
  int r = masterColors[value][0];
  int g = masterColors[value][1];
  int b = masterColors[value][2];
  setVuRGB(r,g,b,vuNr);
}

void setVuRGB(int r, int g, int b, int vuNr) {
    analogWrite(VU_PWM_PINS_R[vuNr], r);
    analogWrite(VU_PWM_PINS_G[vuNr], g);
    analogWrite(VU_PWM_PINS_B[vuNr], b);
}

void setVuR(int r, int vuNr) {
  analogWrite(VU_PWM_PINS_R[vuNr], r);
}
void setVuG(int g, int vuNr) {
  analogWrite(VU_PWM_PINS_G[vuNr], g);
}
void setVuB(int b, int vuNr) {
  analogWrite(VU_PWM_PINS_B[vuNr], b);
}

void writeVuLED(byte ledNr, byte highlow, int vuNr) {
  // they are built in in reverse order
  ledNr = 15 - ledNr -4;
  
  byte chipNr = ledNr / 8;
  byte pinNr = ledNr % 8;
  if(chipNr < 2) {
    bitWrite(vuData[vuNr][chipNr], pinNr, highlow);
  }
}

void shiftOutVu(int vuNr) {
  digitalWrite(VU_LATCH_PINS[vuNr], LOW);
  // shift out in reverse order
  for(int i = 1; i>=0; i--) {
    shiftOut(VU_DATA_PINS[vuNr], VU_CLOCK_PINS[vuNr], MSBFIRST, vuData[vuNr][i]);
  }
  digitalWrite(VU_LATCH_PINS[vuNr], HIGH);
}


