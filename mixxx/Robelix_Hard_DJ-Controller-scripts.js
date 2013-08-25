/* Mixxx scripting for HardDJ
 * 
 * https://github.com/robelix/hard-dj
 * 
 * author roland@robelix.com
 * CC-BY-SA http://creativecommons.org/licenses/by-sa/3.0/at/
 */

function HardDJ() {}


// led number setup //
//------------------//
HardDJ.Leds = {
  
    // left deck
  "[Channel1]" : {
      'play_red':	32,
      'play_green':	33,
      'play_blue':	34,
      'cue_red':	36,
      'cue_green':	37,
      'cue_blue':	38,
      'headphone':	31,
      'scratching':	28,
      'rev':		39,
      'ff':		35,
      'seek':		30,
      'speed':		29,
      'loop':		22,
      'loopend':	23,
      'loop+':		24,
      'loop4':		25,
      'loop2':		26,
      'loop-':		27,
      'pitch1':		21,
      'sync':		20
  },
  
  // right deck
  "[Channel2]": {
      'play_red':	0,
      'play_green':	1,
      'play_blue':	2,
      'cue_red':	4,
      'cue_green':	5,
      'cue_blue':	6,
      'headphone':	19,
      'scratching':	16,
      'rev':		7,
      'ff':		3,
      'seek':		18,
      'speed':		17,
      'loop':		10,
      'loopend':	11,
      'loop+':		12,
      'loop4':		13,
      'loop2':		14,
      'loop-':		15,
      'pitch1':		9,
      'sync':		8
  }
};
HardDJ.caseLeds     = 123;
HardDJ.vuLedsCh1   = 119;
HardDJ.vuLedsCh2   = 120;
HardDJ.vuLedsLeft   = 121;
HardDJ.vuLedsRight = 122;

// status variables //
//------------------//
HardDJ.currentloop = {
	"[Channel1]" : 0,
	"[Channel2]" : 0
};
HardDJ.scratchMode = {
	"[Channel1]" : false,
	"[Channel2]" : false
};
HardDJ.speedMode = {
	"[Channel1]" : false,
	"[Channel2]" : false
};
HardDJ.seekMode = {
	"[Channel1]" : false,
	"[Channel2]" : false
};
HardDJ.vuValues = {
	"channel1"  : 0,
	"channel2"  : 0,
	"left"	       : 0,
	"right"	       : 0,
	"caseLeds"  : 0
};

HardDJ.PitchBendSensitivity = 0.00001;
HardDJ.SearchSensitivity = 0.01;

HardDJ.JogWheelLastValue = {
	"[Channel1]" : 0,
	"[Channel2]" : 0
};

HardDJ.init = function(id){
    //print ("Initalizing Reloop Digital Jockey 2 Controler Edition.");
    HardDJ.resetLEDs();

    // map engine stuff for MIDI out
    engine.connectControl("[Channel1]","play","HardDJ.isChannelPlaying");
    engine.connectControl("[Channel2]","play","HardDJ.isChannelPlaying");
    
    engine.connectControl("[Channel1]","pfl","HardDJ.isChannelHeadphonesOn");
    engine.connectControl("[Channel2]","pfl","HardDJ.isChannelHeadphonesOn");
    
    engine.connectControl("[Channel1]","beatsync","HardDJ.isChannelSync");
    engine.connectControl("[Channel2]","beatsync","HardDJ.isChannelSync");

    engine.connectControl("[Channel1]","reverse","HardDJ.isChannelReverse");
    engine.connectControl("[Channel2]","reverse","HardDJ.isChannelReverse");
    
    engine.connectControl("[Channel1]","loop_enabled","HardDJ.isChannelLooped");
    engine.connectControl("[Channel2]","loop_enabled","HardDJ.isChannelLooped");
    engine.connectControl("[Channel1]","beatloop","HardDJ.isChannelBeatLoop");
    engine.connectControl("[Channel2]","beatloop","HardDJ.isChannelBeatLoop");
    engine.connectControl("[Channel1]","loop_double","HardDJ.isChannelBeatLoop");
    engine.connectControl("[Channel2]","loop_double","HardDJ.isChannelBeatLoop");
    engine.connectControl("[Channel1]","loop_halve","HardDJ.isChannelBeatLoop");
    engine.connectControl("[Channel2]","loop_halve","HardDJ.isChannelBeatLoop");
    
    // mp vu-meters
    engine.connectControl("[Channel1]", "VuMeter", 	"HardDJ.meter");
    engine.connectControl("[Channel2]", "VuMeter",	"HardDJ.meter");
    engine.connectControl("[Master]", 	"VuMeter", 	"HardDJ.meter");
    engine.connectControl("[Master]", 	"VuMeterL", 	"HardDJ.meter");
    engine.connectControl("[Master]", 	"VuMeterR", 	"HardDJ.meter");
}

HardDJ.meter = function(value, group, key) { 
    value = parseFloat(value);

    if (group == "[Channel1]") {
        // channel 1
        var val = Math.round(value*12);
        if (val != HardDJ.vuValues["channel1"]) {
            HardDJ.sendLED(HardDJ.vuLedsCh1, val);
            HardDJ.vuValues["channel1"] = val;
        }
    } else if (group == "[Channel2]") {
        // channel 2
        var val = Math.round(value*12);
        if (val != HardDJ.vuValues["channel2"]) {
            HardDJ.sendLED(HardDJ.vuLedsCh2, val);
            HardDJ.vuValues["channel2"] = val;
        }
    } else if (group == "[Master]") {
        if (key == "VuMeterL") {
            // master left
            var val = Math.round(value*12);
            if (val != HardDJ.vuValues["left"]) {
                HardDJ.sendLED(HardDJ.vuLedsLeft, val);
                HardDJ.vuValues["left"] = val;
            }
        } else if (key == "VuMeterR") {
            // master right
            var val = Math.round(value*12);
            if (val != HardDJ.vuValues["right"]) {
                HardDJ.sendLED(HardDJ.vuLedsRight, val);
                HardDJ.vuValues["right"] = val;
            }
        } else if (key == "VuMeter") {
            // Master Value - used for case leds
            // some calculation to get nice values for case leds
            value = (value*1.7)-0.7;
            if (value<0) { value=0; };
            value = value*value;
            value = value-0.25;
            value = value *2;
            if (value<0) { value=0; };
            if (value>1) { value=1; };
            var val = Math.round(value * 127);
	
            if (val != HardDJ.vuValues["caseLeds"])  { // 4 case led value
                HardDJ.sendLED(HardDJ.caseLeds, val);
                HardDJ.vuValues["caseLeds"] = val;
            }
        }
    }
}

// set led functions //
//-------------------//

HardDJ.sendLED = function(lednr, val) {
    midi.sendShortMsg(0x93, lednr, val);
}
HardDJ.sendLEDon = function(group, ledname) {
    midi.sendShortMsg(0x93, HardDJ.getLedNr(group,ledname), 1);
}
HardDJ.sendLEDoff = function(group, ledname) {
    midi.sendShortMsg(0x83, HardDJ.getLedNr(group,ledname), 1);
}
HardDJ.getLedNr = function(group,ledname) {
    return HardDJ.Leds[group][ledname];
}
HardDJ.ledSwitcher = function(group, ledname, value) {
    if(value == 0) {
	HardDJ.sendLEDoff(group,ledname);
    } else {
	HardDJ.sendLEDon(group,ledname);
    }
}


HardDJ.resetLEDs = function() {
    HardDJ.sendLED(HardDJ.caseLeds,0);
    //HardDJ.sendLEDoff(0);
    //HardDJ.sendLEDoff(1);
    
    //HardDJ.sendLEDoff(100);
    //HardDJ.sendLEDoff(101);
    //HardDJ.sendLEDoff(102);
    //HardDJ.sendLEDoff(103);
}

// status callback functions //
//---------------------------//

HardDJ.isChannelPlaying = function (value, group){
    if(value == 0){
	HardDJ.sendLEDoff(group,'play_green');
	HardDJ.sendLEDon(group,'play_red');
    }
    else{ //if deck is playing 
	HardDJ.sendLEDoff(group,'play_red');
	HardDJ.sendLEDon(group,'play_green');
    }
}

HardDJ.isChannelHeadphonesOn = function(value, group) {
    HardDJ.ledSwitcher(group,'headphone',value);
}
HardDJ.isChannelSync = function(value, group) {
    HardDJ.ledSwitcher(group,'sync',value);
}
HardDJ.isChannelReverse = function(value, group) {
    HardDJ.ledSwitcher(group,'rev',value);
}
HardDJ.isChannelLooped = function(value, group) {
    HardDJ.ledSwitcher(group,'loop',value);
    HardDJ.setBeatLoopLeds(group,value);
}
HardDJ.isChannelBeatLoop = function(value, group) {
    value = engine.getValue(group, 'loop_enabled');
    HardDJ.setBeatLoopLeds(group,value);
}
HardDJ.setBeatLoopLeds = function(group, loopenabled) {
    HardDJ.ledSwitcher(group, 'loop-', 0);
    HardDJ.ledSwitcher(group, 'loop2', 0);
    HardDJ.ledSwitcher(group, 'loop4', 0);
    HardDJ.ledSwitcher(group, 'loop+', 0);
    
    if (loopenabled > 0) {
	// enabled
	var value = HardDJ.currentloop[group];
	if(value < 2) {
	    HardDJ.ledSwitcher(group, 'loop-', 1);
	} else if(value == 2) {
	    HardDJ.ledSwitcher(group, 'loop2', 1);
	} else if(value == 4) {
	    HardDJ.ledSwitcher(group, 'loop4', 1);
	} else {
	    HardDJ.ledSwitcher(group, 'loop+', 1);
	}
    }
}


// Jog Wheels //
//------------//

HardDJ.scratchEnable = function(channel, control, value, status, group) {
    // called by the scratch buttons press
    HardDJ.scratchMode[group] = true;
    HardDJ.switchOnScratch( group );
}
HardDJ.switchOnScratch = function(group) {
    var alpha = 1.0/8;
    var beta = alpha/32;
    engine.scratchEnable( HardDJ.groupToDeck(group) , 240, 60, alpha, beta);
    HardDJ.sendLEDon(group,'scratching');
}
HardDJ.scratchDisable = function(channel, control, value, status, group) {
    // called by scratch button release
    HardDJ.scratchMode[group] = false;
    engine.scratchDisable( HardDJ.groupToDeck(group) );
    HardDJ.sendLEDoff(group,'scratching');
}
HardDJ.speedEnable = function(channel, control, value, status, group) {
    // called by speed button press
    HardDJ.speedMode[group] = true;
    HardDJ.sendLEDon(group, 'speed');
}
HardDJ.speedDisable = function(channel, control, value, status, group) {
    // called by speed button release
    HardDJ.speedMode[group] = false;
    HardDJ.sendLEDoff(group, 'speed');
}
HardDJ.seekEnable = function(channel, control, value, status, group) {
    // called by speed button press
    HardDJ.seekMode[group] = true;
    HardDJ.sendLEDon(group, 'seek');
}
HardDJ.seekDisable = function(channel, control, value, status, group) {
    // called by speed button release
    HardDJ.seekMode[group] = false;
    HardDJ.sendLEDoff(group, 'seek');
}


HardDJ.JogWheel = function (channel, control, value, status, group) {
    // called by the wheels
  
    if (HardDJ.scratchMode[group]) {
	HardDJ.scratch(group,value);
    }
    if (HardDJ.speedMode[group]) {
	HardDJ.chSpeed(group,value);
    }
    if (HardDJ.seekMode[group]) {
	HardDJ.seek(group,value);
    }
    HardDJ.JogWheelLastValue[group] = value;
}

HardDJ.seek = function(group,value) {
    var direction = HardDJ.wheelDirection(HardDJ.JogWheelLastValue[group], value);
    engine.setValue(group, 'jog', direction*3);
}

HardDJ.scratch = function(group, value) {
    var direction = HardDJ.wheelDirection(HardDJ.JogWheelLastValue[group], value);
    engine.scratchTick( HardDJ.groupToDeck(group) ,direction);
}

HardDJ.chSpeed = function(group, value) {
    var direction = HardDJ.wheelDirection(HardDJ.JogWheelLastValue[group], value);
    if(direction > 0) {
      engine.setValue(group, "rate_perm_up_small",0.25);
    } else {
      engine.setValue(group, "rate_perm_down_small",0.25);
    }
}

HardDJ.groupToDeck = function(group) {
    if (group == "[Channel1]") {
	return 1;
    } else if (group == "[Channel2]") {
	return 2;
    }
    return 0;
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



HardDJ.headphoneToggle = function (channel, control, value, status, group) {
    if (engine.getValue(group, "pfl")==0) {
	engine.setValue(group, "pfl", 1);
    } else {
	engine.setValue(group, "pfl", 0);
    }
}

HardDJ.pitch1 = function(channel, control, value, status, group) {
    // called from Pitch 1 buttons
    engine.setValue(group, "rate", 0);
    HardDJ.sendLEDoff(group,'sync');
}



// Looping functions   //
// ------------------- //

HardDJ.setLoop2 = function(channel, control, value, status, group) {
    // called from Loop 2 buttons
    engine.setValue(group, 'beatloop', 2);
    HardDJ.currentloop[group] = 2;
}

HardDJ.setLoop4 = function(channel, control, value, status, group) {
    // called from Loop 4 buttons
    engine.setValue(group, 'beatloop', 4);
    HardDJ.currentloop[group] = 4;
}

HardDJ.loopDouble = function(channel, control, value, status, group) {
    // called from Loop + buttons
    engine.setValue(group, 'loop_double', 1);
    HardDJ.currentloop[group] = HardDJ.currentloop[group]*2;
}

HardDJ.loopHalve = function(channel, control, value, status, group) {
    // called from Loop - buttons
    engine.setValue(group, 'loop_halve', 1);
    HardDJ.currentloop[group] = HardDJ.currentloop[group]/2;
}

HardDJ.loopExit = function(channel, control, value, status, group) {
    // called from Loop end buttons
    if ( engine.getValue(group, 'loop_enabled') ) {
	engine.setValue(group, 'reloop_exit', 1);
    }
}

HardDJ.loopStart = function(channel, control, value, status, group) {
    // called from Loop buttons
    if ( engine.getValue(group, 'loop_enabled') ) {
	// loop active - do nothing
	return;
    }
    
    // does not yet work as expeced - so better do nothing for now
    return;
    
    // no end position - set it
    if( engine.getValue(group, 'loop_end_position') >=0 ) {
	engine.setValue(group, 'loop_out', 1);
    } else {
	// set start position
	engine.setValue(group, 'loop_in', 1);
    }
}


