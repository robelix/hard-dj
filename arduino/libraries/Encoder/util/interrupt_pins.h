// interrupt pins for known boards

// Teensy (and maybe others) define these automatically
#if !defined(CORE_NUM_INTERRUPT)

// Wiring boards
#if defined(WIRING)
  #define CORE_NUM_INTERRUPT	NUM_EXTERNAL_INTERRUPTS
  #if NUM_EXTERNAL_INTERRUPTS > 0
  #define CORE_INT0_PIN		EI0
  #endif
  #if NUM_EXTERNAL_INTERRUPTS > 1
  #define CORE_INT1_PIN		EI1
  #endif
  #if NUM_EXTERNAL_INTERRUPTS > 2
  #define CORE_INT2_PIN		EI2
  #endif
  #if NUM_EXTERNAL_INTERRUPTS > 3
  #define CORE_INT3_PIN		EI3
  #endif
  #if NUM_EXTERNAL_INTERRUPTS > 4
  #define CORE_INT4_PIN		EI4
  #endif
  #if NUM_EXTERNAL_INTERRUPTS > 5
  #define CORE_INT5_PIN		EI5
  #endif
  #if NUM_EXTERNAL_INTERRUPTS > 6
  #define CORE_INT6_PIN		EI6
  #endif
  #if NUM_EXTERNAL_INTERRUPTS > 7
  #define CORE_INT7_PIN		EI7
  #endif

// Arduino Uno, Duemilanove, Diecimila, LilyPad, Mini, Fio, etc...
#elif defined(__AVR_ATmega328P__) || defined(__AVR_ATmega168__) || defined(__AVR_ATmega8__)
  #define CORE_NUM_INTERRUPT	2
  #define CORE_INT0_PIN		2
  #define CORE_INT1_PIN		3

// Arduino Mega
#elif defined(__AVR_ATmega1280__) || defined(__AVR_ATmega2560__)
  #define CORE_NUM_INTERRUPT	6
  #define CORE_INT0_PIN		2
  #define CORE_INT1_PIN		3
  #define CORE_INT2_PIN		21
  #define CORE_INT3_PIN		20
  #define CORE_INT4_PIN		19
  #define CORE_INT5_PIN		18

// Sanguino
#elif defined(__AVR_ATmega644P__) || defined(__AVR_ATmega644__)
  #define CORE_NUM_INTERRUPT	3
  #define CORE_INT0_PIN		10
  #define CORE_INT1_PIN		11
  #define CORE_INT2_PIN		2

// Chipkit Uno32 - attachInterrupt may not support CHANGE option
#elif defined(__PIC32MX__) && defined(_BOARD_UNO_)
  #define CORE_NUM_INTERRUPT	5
  #define CORE_INT0_PIN		38
  #define CORE_INT1_PIN		2
  #define CORE_INT2_PIN		7
  #define CORE_INT3_PIN		8
  #define CORE_INT4_PIN		35

// Chipkit Uno32 - attachInterrupt may not support CHANGE option
#elif defined(__PIC32MX__) && defined(_BOARD_MEGA_)
  #define CORE_NUM_INTERRUPT	5
  #define CORE_INT0_PIN		3
  #define CORE_INT1_PIN		2
  #define CORE_INT2_PIN		7
  #define CORE_INT3_PIN		21
  #define CORE_INT4_PIN		20

// http://hlt.media.mit.edu/?p=1229
#elif defined(__AVR_ATtiny45__) || defined(__AVR_ATtiny85__)
  #define CORE_NUM_INTERRUPT    1
  #define CORE_INT0_PIN		2
#endif
#endif

#if !defined(CORE_NUM_INTERRUPT)
#error "Interrupts are unknown for this board, please add to this code"
#endif
#if CORE_NUM_INTERRUPT <= 0
#error "Encoder requires interrupt pins, but this board does not have any :("
#error "You could try defining ENCODER_DO_NOT_USE_INTERRUPTS as a kludge."
#endif

