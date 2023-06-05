// Digistar Script 
// Created: 11/10/2021

include('$content/user/om-digistar-lib/dsproxy.js');

let nav = new DsObject('navigation');
let scene = new DsObject('scene');
let system = new DsObject('system');
let timeData = new DsObject('timeDilationData');
let eye = new DsObject('eye');
let lastTime = scene.date * 86400; // system.time;
let currentTime;
let lastPosition = eye.position;
let currentPosition;
const c = 299792458; // speed of light, (m/s)
const GoverCSquared = 7.4214e-28; // m/kg
const mSun = 1.9891e+30; // mass of Sun (kg)

// L = Distance traveled (as seen from Earth), tSelf = time taken (on ship)
// Returns: v - velocity on ship, and tEarth - time elapsed on Earth
let vSelf = function(L, tSelf) {
	if (L == 0) {
		return {v:0,tEarth: tSelf,tRate:1};
	}

	let v = c/Math.sqrt(1+(c*tSelf)**2/L**2);
	let tEarth = L/v;
	let tRate = tEarth/tSelf;
	return {v:v, tEarth: tEarth, tRate: tRate};
}

// M= Mass of object (kg), R= radius of orbit (m)
// Sanity check: M87= 1.31e+40kg at 2.599e+13m = ~~0.5s (ship) per 1s (earth)
// Returns: time elapsed on Earth
let tGrav = function(M, R) {
	if (M == 0 || R == 0) {
		return 1;
	}
	let t = Math.sqrt(1 - ((2*GoverCSquared) * (M/R)));
	return 1/t;
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

timeData.tShip = 0;
timeData.tEarth = 0;

while (true) {
	currentPosition = eye.position;
	currentTime = scene.date * 86400;
	
	let distance = dist(lastPosition, currentPosition);
	lastPosition = currentPosition;

	let deltaT = currentTime - lastTime;
	
	lastTime = currentTime;
	
	if (deltaT == 0) {
		timeData.timeRate = "Time stopped";
		continue; // no divide by zero pls
	}
	
	let v = vSelf(distance, deltaT);
	let M = 0;
	let R = 0;
	timeData.rVelocity = v.tRate;

	if (nav.destObject.name) {
		let object = DsObject.get(nav.destObject.name);
		if (object.class == 'blackHoleClass') {
			R = ToMeters(object.radius);
			M = object.mass * mSun;
		}
	}
	
	// Sanity check: M87= 1.31e+40kg at 2.599e+13m = ~~2s earth per 1s ship
	let gRate = tGrav(M, R);
	
	timeData.rGravity = gRate;

	if (isNaN(gRate)) {
		timeData.timeRate = "Inside black hole!";
		Ds.Wait(1);
		continue;
	}
	
	const totalRate = v.tRate * gRate;
	
	if (!timeData.earthPaused) {
		timeData.tEarth = timeData.tEarth + (deltaT * totalRate);
		timeData.cPercent = formatcPercent((v.v/c) * 100);

		if (timeData.overrideTimeRate == "") {
			timeData.timeRate = formatTimeRate(totalRate);
		} else {
			timeRate.text = overrideTimeRate.text;
		}
		
		timeData.earthTime = formatTime(timeData.tEarth + timeData.tEarthOffset); // + addTime.position.x
	}
	
	if (!timeData.shipPaused) {
		timeData.tShip =  timeData.tShip + deltaT;
		timeData.shipTime = formatTime(timeData.tShip);
	}
	
	// Populate text objects
	if (timeData.earthTimeText.name) {
		DsObject.get(timeData.earthTimeText.name).text = timeData.earthTime;
	}
	if (timeData.shipTimeText.name) {
		DsObject.get(timeData.shipTimeText.name).text = timeData.shipTime;
	}
	if (timeData.timeRateText.name) {
		DsObject.get(timeData.timeRateText.name).text = timeData.timeRate;
	}
	if (timeData.cPercentText.name) {
		DsObject.get(timeData.cPercentText.name).text = timeData.cPercent;
	}
	
	Ds.Wait(0.1);
	
	//break;
}
