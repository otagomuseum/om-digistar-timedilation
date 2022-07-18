// Digistar Script 
// Created: 11/10/2021

include('$content/user/om-digistar-lib/dsproxy.js');

let nav = new DsObject('navigation');
let scene = new DsObject('scene');
let system = new DsObject('system');
let timeData = new DsObject('timeDilationData', 'TimeData');

let earthTime = new DsObject('earthTime');
let timeRate = new DsObject('timeRate');
let timeElapsed = 0;
let shipTime = new DsObject('shipTime');
let eye = new DsObject('eye');
let overrideTimeRate = new DsObject('overrideTimeRate');
let lastTime = scene.date * 86400; // system.time;
let currentTime;
let lastPosition = eye.position;
let currentPosition;
const c = 299792458; // speed of light, m/s
const GoverCSquared = 7.4214e-28; // m/kg

let updateEarth = true;
let updateShip = true;
let pause = false;

// L = Distance traveled (as seen from Earth), tSelf = time taken (on ship)
// Returns: v - velocity on ship, and tEarth - time elapsed on Earth
let vSelf = function(L, tSelf) {
	let v = c/Math.sqrt(1+(c*tSelf)**2/L**2);
	return {v:v, tEarth: L/v};
}

// M= Mass of object (kg), R= radius of orbit (m)
// Sanity check: M87= 1.31e+40kg at 2.599e+13m = ~~0.5s (ship) per 1s (earth)
// Returns: time elapsed on Earth
let tGrav = function(M, R, tSelf) {
	let t = Math.sqrt(1 - ((2*GoverCSquared) * (M/R)));
	return tSelf/t;
}

let dist = function(posA, posB) {
	return Math.sqrt((posA.x -posB.x)**2 + (posA.y - posB.y)**2 + (posA.z - posB.z)**2);
}

let formatTimeRate = function(tRate) {
	if (isNaN(tRate)) {
		return "1x";
	}

	const thousands = tRate / 1000;
	const millions = thousands /1000;
	const billions = millions /1000;
	const trillions = billions /1000; 
	
	if (trillions > 1) {
		return `${trillions.toFixed(2)} trillion times`;
	} else if (billions > 1) {
		return `${billions.toFixed(2)} billion times`;
	} else if (millions > 1) {
		return `${millions.toFixed(2)} million times`;
	} else if (thousands > 1) {
		return `${thousands.toFixed(2)} thousand times`;
	} else {
		return `${tRate.toFixed(2)}x`;
	}
}

let formatTime = function(tSeconds) {
	const tMinutes = tSeconds/60;
	const tHours = tMinutes/60;
	const tDays = tHours/24;
	const tYears = tDays/365;
	const tCenturies = tYears/100;
	const tMillennia = tYears/1000;
	const tMillion = tMillennia/1000;
	const tBillion = tMillion/1000;
	const tTrillion = tBillion/1000;
	
	if (tTrillion > 1) {
		return `${tTrillion.toFixed(1)} trillion years`;
	} else if (tBillion > 1) {
		return `${tBillion.toFixed(1)} billion years`;
	} else if (tMillion > 1) {
		return `${tMillion.toFixed(1)} million years`;
	} else if (tMillennia > 1) {
		return `${Math.round(tMillennia)} thousand years`;
	} else if (tCenturies > 1) {
		return `${Math.round(tCenturies)} hundred years`;
	} else if (tYears > 1) {
		return `${Math.round(tYears)} years`;
	} else if (tDays > 1) {
		return `${Math.round(tDays)} days`;
	} else if (tHours > 1) {
		return `${Math.round(tHours)} hours|${Math.round(tMinutes % 60)} minutes`;
	} else if (tMinutes > 1) {
		return `${Math.round(tMinutes)} minutes|${Math.round(tSeconds % 60)} seconds`;
	}
	
	return `${Math.round(tSeconds)} seconds`;
}

let formatcPercent = function(percent) {
	if (isNaN(percent)) {
		return "1x";
	} else 	if (100-percent < 0.00001) {
		return "Almost speed of light";
	} else {
	//	let dec = Number(cDecimal.text);
		return percent.toFixed(5) + "%";
	}
}

let tEarthTotal = 0;

while (true) {
	let msg = Ds.GetMessage();
	if (msg == "disableEarth") {
		updateEarth = false;
	}
	if (msg == "enableEarth") {
		updateEarth = true;
	}
	if (msg == "disableShip") {
		updateShip = false;
	}
	if (msg == "enableShip") {
		updateShip = true;
	}
	if (msg == "pause") {
		pause = true;
	}
	if (msg == "unpause") {
		pause = false;
	}
	if (msg == "resetTime") {
		timeElapsed = 0;
		tEarthTotal = 0;
		addTime.position = {x:0,y:0,z:0};
	}
	if (msg == "syncTime") {
		tEarthTotal = timeElapsed;
	} 
	if (msg == "status") {
		print(tEarthTotal);
	}

	currentPosition = eye.position;
	currentTime = scene.date * 86400;
	
	let distance = dist(lastPosition, currentPosition);
	lastPosition = currentPosition;

	let deltaT = currentTime - lastTime;
	
	lastTime = currentTime;
	
	if (deltaT == 0 || pause) {
		timeData.timeRate = "Time stopped";
		continue; // no divide by zero pls
	}
	
	timeData.tShip =  timeData.tShip + deltaT;
	timeElapsed = timeElapsed + deltaT;

	let v = vSelf(distance, deltaT);
	let g = tGrav(8.26e+36, 5.65863e+07, deltaT);
	
	timeData.tEarthOffset = g;

	if (!isNaN(v.tEarth)) {
		timeData.tEarth = timeData.tEarth + v.tEarth + g;
		tEarthTotal = tEarthTotal + v.tEarth + g;
	} else {
		timeData.tEarth = timeData.tEarth + deltaT + g;
		tEarthTotal = tEarthTotal + deltaT + g;
	}
	
	if (updateEarth) {
		timeData.cPercent = formatcPercent((v.v/c) * 100);
		timeData.timeRate = formatTimeRate(v.tEarth / deltaT);

		if (timeData.overrideTimeRate == "") {
			
			timeRate.text = formatTimeRate(v.tEarth / deltaT);
		} else {
			timeRate.text = overrideTimeRate.text;
		}
		timeData.earthTime = formatTime(tEarthTotal);
		earthTime.text = formatTime(tEarthTotal); // + addTime.position.x
		
	}
	
	if (updateShip) {
		timeData.shipTime = formatTime(timeElapsed);
		shipTime.text = formatTime(timeElapsed);
	}
	
	
	Ds.Wait(0.1);
}