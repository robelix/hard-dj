function HardDJ() {}

//HardDJ.ledOn = 0x7F;
//HardDJ.ledOff = 0x00;
//HardDJ.keyPressed = 0x7F;
//HardDJ.keyUp = 0x00;

//HardDJ.scratchModeChannel1 = false;
//HardDJ.scratchModeChannel2 = false;

//HardDJ.searchModeChannel1 = false;
//HardDJ.searchModeChannel2 = false;

//boolean value that indicated if CUP LED is active
//HardDJ.CUP_Button1_IsActive = false;
//HardDJ.CUP_Button2_IsActive = false;


// led number setup
HardDJ.Leds = {
  
    // left deck
  1: {
      'play_red':	8,
      'play_green':	9,
      'play_blue':	10,
      'cue_red':	12,
      'cue_green':	13,
      'cue_blue':	14,
      'headphone':	11,
      'scratching':	15
  },
  
  // right deck
  2: {
      'play_red':	0,
      'play_green':	1,
      'play_blue':	2,
      'cue_red':	4,
      'cue_green':	5,
      'cue_blue':	6,
      'headphone':	3,
      'scratching':	7
  }
  
}; 


HardDJ.init = function(id){
    //print ("Initalizing Reloop Digital Jockey 2 Controler Edition.");
    HardDJ.resetLEDs();

    // map engine stuff for MIDI out
    engine.connectControl("[Channel1]","play","HardDJ.isChannel1_Playing");
    engine.connectControl("[Channel2]","play","HardDJ.isChannel2_Playing");
    engine.connectControl("[Channel1]","pfl","HardDJ.isChannel1_HeadphonesOn");
    engine.connectControl("[Channel2]","pfl","HardDJ.isChannel2_HeadphonesOn");

    // mp vu-meters
    engine.connectControl("[Channel1]", "VuMeter", 	"HardDJ.meter");
    engine.connectControl("[Channel2]", "VuMeter",	"HardDJ.meter");
    engine.connectControl("[Master]", 	"VuMeter", 	"HardDJ.meter");
}

HardDJ.vuValues = Array();

HardDJ.meter = function(value, group, key) { 
    var deck = HardDJ.groupToDeck(group);
    // there is 16 leds in HardDJ volume meter.
    

    var val = Math.round(parseFloat(value) * 16);     

    if (val != HardDJ.vuValues[group])  {
      HardDJ.vuValues[group] = val;

      if (deck == 0) {
	  HardDJ.sendLED(100, val);
      } // else if (deck == 1) {
	//  HardDJ.sendLED(101, val);
      //} else {
	//  if (key == "VuMeterL") {
	  //    HardDJ.sendLED(102, val);
	  //} else {
	  //    HardDJ.sendLED(103, val);
	  //}
      //}
    }
}

HardDJ.groupToDeck = function(group) {
    var the_char = group.charAt(8);
    
	if (the_char == '1') {
		return 0;
	} else if (the_char == '2') {
		return 1;
	} else {
        return -1;
    }
}


HardDJ.sendLED = function(lednr, val) {
	    //midi.sendShortMsg(0x93, lednr, val);
}
HardDJ.sendLEDon = function(channel, ledname) {
	    midi.sendShortMsg(0x93, HardDJ.getLedNr(channel,ledname), 1);
}
HardDJ.sendLEDoff = function(channel, ledname) {
	    midi.sendShortMsg(0x83, HardDJ.getLedNr(channel,ledname), 1);
}
HardDJ.getLedNr = function(channel,ledname) {
    return HardDJ.Leds[channel][ledname];
}


HardDJ.resetLEDs = function() {
    //HardDJ.sendLEDoff(0);
    //HardDJ.sendLEDoff(1);
    
    //HardDJ.sendLEDoff(100);
    //HardDJ.sendLEDoff(101);
    //HardDJ.sendLEDoff(102);
    //HardDJ.sendLEDoff(103);
}


HardDJ.isChannel1_Playing = function (value){
    script.debug(1, 'playing', value, 0, 0);
    if(value == 0){
	HardDJ.sendLEDoff(1,'play_green');
	HardDJ.sendLEDon(1,'play_red');
    }
    else{ //if deck is playing 
	HardDJ.sendLEDoff(1,'play_red');
	HardDJ.sendLEDon(1,'play_green');
    }
}
HardDJ.isChannel2_Playing = function (value){
    if(value == 0){
	HardDJ.sendLEDoff(2,'play_green');
	HardDJ.sendLEDon(2,'play_red');
    }
    else{ //if deck is playing 
	HardDJ.sendLEDoff(2,'play_red');
	HardDJ.sendLEDon(2,'play_green');
    }
}

HardDJ.isChannel1_HeadphonesOn = function(value) {
    if(value == 0) {
	HardDJ.sendLEDoff(1,'headphone');
    } else {
	HardDJ.sendLEDon(1,'headphone');
    }
}
HardDJ.isChannel2_HeadphonesOn = function(value) {
    if(value == 0) {
	HardDJ.sendLEDoff(2,'headphone');
    } else {
	HardDJ.sendLEDon(2,'headphone');
    }
}

/* Jog Wheels */

HardDJ.JogWheel1 = function (channel, control, value){
	HardDJ.JogWheel(1, control, value);
}

HardDJ.JogWheel2 = function (channel, control, value){
	HardDJ.JogWheel(2, control, value);
}

HardDJ.scratchMode = new Array();
HardDJ.scratchMode[1] = false;
HardDJ.scratchMode[2] = false;

HardDJ.speedMode = new Array();
HardDJ.speedMode[1] = false;
HardDJ.speedMode[2] = false;

HardDJ.scratchEnable1 = function(channel, control, value) {
      HardDJ.scratchMode[1] = true;
      HardDJ.switchOnScratch(1);
}
HardDJ.scratchEnable2 = function(channel, control, value) {
      HardDJ.scratchMode[2] = true;
      HardDJ.switchOnScratch(2);
}
HardDJ.switchOnScratch = function(channel) {
      var alpha = 1.0/8;
      var beta = alpha/32;
      engine.scratchEnable(channel, 240, 60, alpha, beta);
      HardDJ.sendLEDon(channel,'scratching');
}
HardDJ.scratchDisable1 = function(channel,control,value) {
    HardDJ.scratchMode[1] = false;
    engine.scratchDisable(1);
    HardDJ.sendLEDoff(1,'scratching');
}
HardDJ.scratchDisable2 = function(channel,control,value) {
    HardDJ.scratchMode[2] = false;
    engine.scratchDisable(2);
    HardDJ.sendLEDoff(2,'scratching');
}

HardDJ.speedEnable1 = function(channel, control, value) {
  HardDJ.speedMode[1] = true;
}
HardDJ.speedDisable1 = function(channel, control, value) {
  HardDJ.speedMode[1] = false;
}
HardDJ.speedEnable2 = function(channel, control, value) {
  HardDJ.speedMode[2] = true;
}
HardDJ.speedDisable2 = function(channel, control, value) {
  HardDJ.speedMode[2] = false;
}


HardDJ.JogWheel1 = function (channel, control, value){
	HardDJ.JogWheel(1, control, value);
}

HardDJ.JogWheel2 = function (channel, control, value){
	HardDJ.JogWheel(2, control, value);
}

HardDJ.PitchBendSensitivity = 0.00001;
HardDJ.SearchSensitivity = 0.01;

HardDJ.JogWheelLastValue = new Array();
HardDJ.JogWheelLastValue[1] = 0;
HardDJ.JogWheelLastValue[2] = 0;

HardDJ.JogWheel = function (channel, control, value) {
  
  if (HardDJ.scratchMode[channel]) {
    HardDJ.scratch(channel,control,value);
  }
  if (HardDJ.speedMode[channel]) {
    HardDJ.chSpeed(channel,control,value);
  }
  HardDJ.JogWheelLastValue[channel] = value;
}

HardDJ.scratch = function(channel, control, value) {
    var direction = HardDJ.wheelDirection(HardDJ.JogWheelLastValue[channel], value);
    engine.scratchTick(channel,direction);
}
HardDJ.chSpeed = function(channel,control,value) {
    var direction = HardDJ.wheelDirection(HardDJ.JogWheelLastValue[channel], value);
    if(direction > 0) {
      engine.setValue("[Channel"+channel+"]", "rate_perm_up_small",0.25);
    } else {
      engine.setValue("[Channel"+channel+"]", "rate_perm_down_small",0.25);
    }
}


HardDJ.headphoneToggle1 = function (channel, control, value) {
    if (engine.getValue("[Channel1]", "pfl")==0) {
	engine.setValue("[Channel1]", "pfl", 1);
    } else {
	engine.setValue("[Channel1]", "pfl", 0);
    }
}

HardDJ.headphoneToggle2 = function (channel, control, value) {
    if (engine.getValue("[Channel2]", "pfl")==0) {
	engine.setValue("[Channel2]", "pfl", 1);
    } else {
	engine.setValue("[Channel2]", "pfl", 0);
    }
}

HardDJ.wheelDirection = function(oldValue,value) {
    var direction = 0;
    if (value > oldValue) {
      if (value - oldValue > 100) {
	direction = -1;
      } else {
	direction = 1;
      }
    }
    if (value < oldValue) {
	if (oldValue - value > 100) {
	  direction = 1;
	} else {
	  direction = -1;
	}
    }
    return direction;
}

/*
HardDJ.JogWheel = function (channel, control, value){
	/*
	 * The JogWheels of the controler work as follows.
	 * Spinning around in reverse order produces decimal values of 0-63
	 * 64 = zero spinning
	 * Forward spinnging = 65-127
	 * depending on the the speed you drag the wheel.
	 */
/*	
	var jogValue = (value - 64)/32; //HardDJ.WheelSensitivity;
	
	//Functionality of Jog Wheel if we're in scratch mode 
	if(channel == 1){
	    if (HardDJ.scratchModeChannel1 == true && HardDJ.searchModeChannel1 == true) {
	      
	        var currentlyPlaying = engine.getValue("[Channel1]","play");
	        if (currentlyPlaying) {
		    var rtu = engine.getValue("[Channel1]", "rate_temp_up_small");
		    var rtd = engine.getValue("[Channel1]", "rate_temp_down_small");
	            if (jogValue > 0) {
	                if (rtd)
			    engine.setValue("[Channel1]", "rate_temp_down_small", 0);
			if (rtu != 1)
			    engine.setValue("[Channel1]", "rate_temp_up_small", 1);
	                
	            }
	            else if (jogValue < 0) {
	                if (rtu)
			    engine.setValue("[Channel1]", "rate_temp_up_small", 0);
	                if (rtd != 1)
			    engine.setValue("[Channel1]", "rate_temp_down_small", 1);
	            }
	            else
	                return;
	        }
	        else {
	            engine.scratchTick(1,jogValue);
	        }
	    }
	    else if (HardDJ.scratchModeChannel1 == true && HardDJ.searchModeChannel1 == false) {
		    engine.scratchTick(1,jogValue);
	    }
	    else if (HardDJ.scratchModeChannel1 == false && HardDJ.searchModeChannel1 == true) {
		var currentlyPlaying = engine.getValue("[Channel1]","play");
	        if (currentlyPlaying) {
		    if (jogValue == 0)
			return;
		    var fwd = engine.getValue("[Channel1]", "fwd");
		    var back = engine.getValue("[Channel1]", "back");
		    if (jogValue > 0) {
			if (back)
			    engine.setValue("[Channel1]", "back", 0);
			if (fwd != 1)
			    engine.setValue("[Channel1]", "fwd", 1);
		    }
		    else if (jogValue < 0) {
			if (fwd)
			    engine.setValue("[Channel1]", "fwd", 0);
			if (back != 1)
			    engine.setValue("[Channel1]", "back", 1);
		    }
		}
		else {
		    var playpos = engine.getValue("[Channel1]", "playposition");
		    if (jogValue > 0) {
		        if (playpos < 1 - HardDJ.SearchSensitivity)
		            playpos += HardDJ.SearchSensitivity;
		        else
		            playpos = 1;
		    }
		    else if (jogValue < 0) {
			if (playpos > HardDJ.SearchSensitivity)
			    playpos -= HardDJ.SearchSensitivity;
			else
			    playpos = 0;
		    }
		    engine.setValue("[Channel1]", "playposition", playpos);
		}
	    }		
	}
}
*/

