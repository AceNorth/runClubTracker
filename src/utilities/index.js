export const convertSecondsPerMileToPaceString = (seconds) => {
  let minsPerMile = Math.floor(seconds / 60).toString() === "NaN" ? "00" : Math.floor(seconds / 60).toString();

  if (minsPerMile === "Infinity") { minsPerMile = "00" };

  let secondsPerMile = Math.floor(seconds % 60).toString() === "NaN" ? "00" : Math.floor(seconds % 60).toString();

  if (secondsPerMile.length === 1) {
    secondsPerMile = "0" + secondsPerMile;
  }

  let paceString = minsPerMile + ":" + secondsPerMile;
  return paceString;
}

export const calculateMilesTraveled = (x1, y1, x2, y2) => {
  // calculates distance traveled in miles
  let radx1 = Math.PI * x1 / 180;
  let radx2 = Math.PI * x2 / 180;
  let rady1 = Math.PI * y1 / 180;
  let rady2 = Math.PI * y2 / 180;
  let theta = y1 - y2;
  let radtheta = Math.PI * theta / 180;
  let dist = Math.sin(radx1) * Math.sin(radx2) + Math.cos(radx1) * Math.cos(radx2) * Math.cos(radtheta);
  dist = Math.acos(dist);
  dist = dist * 180 / Math.PI;
  dist = dist * 60 * 1.1515;
  return dist.toFixed(3);
}

export const calculateSecondsPerMile = (miles, seconds) => {
  return seconds/miles;
}

export const timeSince = function (date) {

  let seconds = Math.floor((new Date() - date) / 1000);

  let interval = Math.floor(seconds / 31536000);

  if (interval > 1) {
    return interval + " YEARS";
  }
  interval = Math.floor(seconds / 2592000);
  if (interval > 1) {
    return interval + " MONTHS";
  }
  interval = Math.floor(seconds / 86400);
  if (interval > 1) {
    return interval + " DAYS";
  }
  interval = Math.floor(seconds / 3600);
  if (interval > 1) {
    return interval + " HOURS";
  }
  interval = Math.floor(seconds / 60);
  if (interval > 1) {
    return interval + " MINUTES";
  }
  return Math.floor(seconds) + " SECONDS";
}