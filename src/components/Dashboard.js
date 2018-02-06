import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Text, View } from 'react-native';
import { Card, CardSection } from './common';

import BackgroundTimer from 'react-native-background-timer';
import BackgroundGeolocation from "react-native-background-geolocation";
global.BackgroundGeolocation = BackgroundGeolocation;

// a separate timer from BackgroundTimer for checks (we can't use more than one BackgroundTimer)
import TimerMixin from 'react-timer-mixin';

import {
  calculateMilesTraveled,
  calculateSecondsPerMile,
  convertSecondsPerMileToPaceString,
} from '../utilities';
import { convertSecondsToPaceString } from '../../../muscleMech/src/components/Utilities/Utilities';

// TODO:
  // configure background timer and background geolocation in xCode
  // see 'toggleTimer' below
  // geolocation library for checks? https://facebook.github.io/react-native/docs/geolocation.html

class Dashboard extends Component {
  constructor(props) {
    super(props);
    mixins: [TimerMixin],
    this.state = {
      runInProgress: false,
      checkInProgress: false,
      totalSeconds: 0,
      totalMiles: 0,
      lastRecordedCoordinates: null,
      previousCoordinates: [],
      lastCheckStats: null,
    }

    this.toggleTimer = this.toggleTimer.bind(this);
    this.onLocation = this.onLocation.bind(this);
    this.onError = this.onError.bind(this);
    this.onMotionChange = this.onMotionChange.bind(this);
    this.onActivityChange = this.onActivityChange.bind(this);
    this.onProviderChange = this.onProviderChange.bind(this);
  }

  toggleTimer() {
    // TODO: this is new, double-check that it works
    // https://github.com/ocetnik/react-native-background-timer
    let toggleVal = !this.state.runInProgress;
    if (toggleVal) {
      BackgroundTimer.runBackgroundTimer(
        () => this.tick(),
        10
      );
    } else {
      BackgroundTimer.stopBackgroundTimer();
    }
    this.setState({ runInProgress: toggleVal })
  }

  tick() {
    this.setState({
      totalSeconds: this.state.totalSeconds + 1,
    });
  }

  beginCheck(differential) {
    // get average pace and coordinates (at time button was pressed)

    const startingPosition = Geolocation.getCurrentPosition();

    const startCheckData = {
      x: startingPosition.coords.x,
      y: startingPosition.coords.y,
      pace: (this.state.totalSeconds / this.state.totalMiles).toFixed(3),
    };

    // renders a big countdown overlay and sets countdown to 3
    // at end of countdown, renders 'GO!'

    // sets countdown to 10
    this.setTimeout(() => this.completeCheck(differential, startCheckData), 10000);
  }

  completeCheck(differential, startCheckData) {

    const endingPosition = Geolocation.getCurrentPosition();

    const milesTraveledDuringCheck = calculateMilesTraveled(
      startCheckData.x,
      startCheckData.y,
      endingPosition.coords.x,
      endingPosition.coords.y,
    );

    const paceDuringCheck = (milesTraveledDuringCheck / 10).toFixed(3);

    // pace during the check was what % of average pace?
    const checkPacePercent = Math.floor((paceDuringCheck / averagePace) * 100);

    this.setState({
      lastCheckStats: {
        averagePace: convertSecondsToPaceString(startCheckData.pace),
        checkPace: convertSecondsPerMileToPaceString(paceDuringCheck),
        checkPacePercent,
        differential,
        pointsEarned: checkPacePercent + (5 * differential),
      }
    })
  }

  componentWillMount() {

    // This handler fires whenever bgGeo receives a location update.
    BackgroundGeolocation.on('location', this.onLocation);

    // This handler fires whenever bgGeo receives an error
    BackgroundGeolocation.on('error', this.onError);

    // This handler fires when movement states changes (stationary->moving; moving->stationary)
    BackgroundGeolocation.on('motionchange', this.onMotionChange);

    // This event fires when a change in motion activity is detected
    BackgroundGeolocation.on('activitychange', this.onActivityChange);

    // This event fires when the user toggles location-services
    BackgroundGeolocation.on('providerchange', this.onProviderChange);

    // 2.  #configure the plugin (just once for life-time of app)
    BackgroundGeolocation.configure({
      // Geolocation Config
      desiredAccuracy: 0,
      stationaryRadius: 25,
      distanceFilter: 10,
      // Activity Recognition
      stopTimeout: 1,
      // Application config
      debug: false, // <-- enable this hear sounds for background-geolocation life-cycle.
      logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
      stopOnTerminate: true, // stop when app closes
      startOnBoot: false, // start when device turns on
      preventSuspend: true,
      // heartbeatInterval: 1
    }, function (state) {
      console.log("- BackgroundGeolocation is configured and ready: ", state.enabled);

      if (!state.enabled) {
        BackgroundGeolocation.start(function () {
          console.log("- Start success");
        });
      }
    });
  }

  componentWillUnmount() {
    // Remove BackgroundGeolocation listeners
    BackgroundGeolocation.un('location', this.onLocation);
    BackgroundGeolocation.un('error', this.onError);
    BackgroundGeolocation.un('motionchange', this.onMotionChange);
    BackgroundGeolocation.un('activitychange', this.onActivityChange);
    BackgroundGeolocation.un('providerchange', this.onProviderChange);
  }

  onError(error) {
    let type = error.type;
    let code = error.code;
    alert(type + " Error: " + code);
  }

  onActivityChange(activityName) {
    console.log('- Current motion activity: ', activityName);  // eg: 'on_foot', 'still', 'in_vehicle'
  }

  onProviderChange(provider) {
    console.log('- Location provider changed: ', provider.enabled);
  }

  onMotionChange(location) {
    console.log('- [js]motionchanged: ', JSON.stringify(location));
  }

  onLocation(location) {

    const secondsSinceLastCheck = this.state.lastRecordedCoordinates ? 
      this.state.totalSeconds - this.state.lastRecordedCoordinates.seconds :
      this.state.totalSeconds;

    const currentSecondsPerMile = calculateSecondsPerMile(milesTraveledSinceLastCheck, secondsSinceLastCheck);

    if (!this.state.lastRecordedCoordinates) {
      const lastRecordedCoordinates = {
        x: location.coords.latitude,
        y: location.coords.longitude,
        seconds: this.state.totalSeconds,
        pace:  currrentSecondsPerMile,
      };
      this.setState({ lastRecordedCoordinates });
    }

    else if (this.state.lastRecordedCoordinates &&
      this.state.runInProgress) {
      const newCoordinates = {
        x: location.coords.latitude,
        y: location.coords.longitude,
        seconds: this.state.totalSeconds,
        pace: currentSecondsPerMile,
      };

      const milesTraveledSinceLastCheck = calculateMilesTraveled(
        this.state.lastRecordedCoordinates.x,
        this.state.lastRecordedCoordinates.y,
        newCoordinates.x,
        newCoordinates.y,
      );

      this.setState({
        lastRecordedCoordinates: newCoordinates,
        totalMiles: (this.state.totalMiles + milesTraveledSinceLastCheck).toFixed(3),
        previousCoordinates: [...this.state.previousCoordinates, this.state.lastRecordedCoordinates],
      })
    };
  }

  renderLastCheckStats() {
    if (this.state.lastCheckStats) {
      const {
        averagePace,
        checkPace,
        checkPacePercent,
        differential,
        pointsEarned,
      } = this.state.lastCheckStats;

      return (<Card>
        <CardSection style={styles.cardHeader}>
          <Text style={styles.headerText}>RUN STATS</Text>
        </CardSection>
        <CardSection>
          <Text>Average Pace: {averagePace} min/mi</Text>
          <Text>Check Pace: {checkPace} min/mi</Text>
          <Text>% Pace Increase: {checkPacePercent}%</Text>
          <Text>Differential: {differential}</Text>
          <Text>Points Earned: {pointsEarned}</Text>
        </CardSection>
      </Card>
      )
    } else {
      return null;
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <Card>
          <CardSection style={styles.cardHeader}>
            <Text style={styles.headerText}>RUN STATS</Text>
          </CardSection>
          <CardSection style={styles.cardHeader}>
            <Text>Current Pace: {convertSecondsPerMileToPaceString(
              this.state.lastRecordedCoordinates.pace
              ) + ' min/mi'}</Text>
            <Text>Average Pace: {convertSecondsPerMileToPaceString(
              Math.floor(this.state.totalSeconds / this.state.totalMiles)
              ) + ' min/mi'}</Text>
            <Text>Total Distance: {this.state.totalMiles}</Text>
          </CardSection>
          <CardSection>
            <Button onPress={this.toggleTimer}>
              START/STOP RUN
  					</Button>
          </CardSection>
        </Card>
        {this.renderLastCheckStats()}
        <Card>
          <CardSection>
            <Button onPress={() => this.triggerCheck(0)}>
              +0 CHECK
  					</Button>
          </CardSection>
          <CardSection>
            <Button onPress={() => this.triggerCheck(1)}>
              +1 CHECK
  					</Button>
          </CardSection>
          <CardSection>
            <Button onPress={() => this.triggerCheck(2)}>
              +2 CHECK
  					</Button>
          </CardSection>
          <CardSection>
            <Button onPress={() => this.triggerCheck(-1)}>
              -1 CHECK
  					</Button>
          </CardSection>
          <CardSection>
            <Button onPress={() => this.triggerCheck(-2)}>
              -2 CHECK
  					</Button>
          </CardSection>
        </Card>
      </View>
    );
  }
}

const styles = {
  container: {
    flex: 1,
    width: null,
    height: null,
  },
  cardHeader: {
    justifyContent: 'center',
    backgroundColor: "#000"
  },
  headerText: {
    color: '#fff',
    fontWeight: 'bold'
  }
}

const mapStateToProps = state => {
  return { };
};

export default connect(mapStateToProps, {})(Dashboard);