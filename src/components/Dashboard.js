import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Text, View, ScrollView } from 'react-native';
import { Card, CardSection, Button } from './common';

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

class Dashboard extends Component {
  constructor(props) {
    super(props);
    mixins: [TimerMixin],
    this.state = {
      location: 'no',
      runInProgress: false,
      checkInProgress: false,
      totalSeconds: 0,
      totalMiles: 0,
      lastRecordedCoordinates: {
        pace: null,
      },
      previousCoordinates: [],
      lastCheckStats: null,
    }

    this.toggleTimer = this.toggleTimer.bind(this);
    this.beginCheck = this.beginCheck.bind(this);
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
      this.timer = BackgroundTimer.setInterval(
        () => this.tick(),
        1000
      );
    } else {
      BackgroundTimer.clearInterval(this.timer);
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

    const startCheckData = {
      x: this.state.lastRecordedCoordinates.x,
      y: this.state.lastRecordedCoordinates.y,
      pace: this.state.lastRecordedCoordinates.pace,
    };

    this.setState({
      location: 'STARTING CHECK!'
    })

    setTimeout(() => this.completeCheck(differential, startCheckData), 15000);

  }

  completeCheck(differential, startCheckData) {

      const milesTraveledDuringCheck = calculateMilesTraveled(
        startCheckData.x,
        startCheckData.y,
        this.state.lastRecordedCoordinates.x,
        this.state.lastRecordedCoordinates.y,
      );

      const paceDuringCheck = (15 / milesTraveledDuringCheck); // 15 seconds / miles

      // pace during the check was what % of average pace?
      const checkPacePercent = Math.floor((paceDuringCheck / startCheckData.pace) * 100);

      this.setState({
        location: 'CHECK DONE',
        lastCheckStats: {
          averagePace: convertSecondsPerMileToPaceString(startCheckData.pace),
          checkPace: convertSecondsPerMileToPaceString(paceDuringCheck),
          milesTraveledDuringCheck,
          paceDuringCheck,
          checkPacePercent,
          differential,
          pointsEarned: checkPacePercent + (5 * differential),
        }
      });
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

    const milesTraveledSinceLastCheck = calculateMilesTraveled(
      this.state.lastRecordedCoordinates.x,
      this.state.lastRecordedCoordinates.y,
      location.coords.latitude,
      location.coords.longitude,
    );

    const currentSecondsPerMile = calculateSecondsPerMile(milesTraveledSinceLastCheck, secondsSinceLastCheck);

    const newCoordinates = {
      x: location.coords.latitude,
      y: location.coords.longitude,
      seconds: this.state.totalSeconds,
      pace: currentSecondsPerMile,
    };

    // temp fix: we're getting a NaN from somewhere
    let newTotalMiles = this.state.totalMiles + Number(milesTraveledSinceLastCheck);
    if (isNaN(newTotalMiles)) newTotalMiles = this.state.totalMiles;

    if (!this.state.lastRecordedCoordinates) {
      this.setState({ lastRecordedCoordinates: newCoordinates });
    }

    else if (this.state.lastRecordedCoordinates &&
      this.state.runInProgress) {

      this.setState({
        lastRecordedCoordinates: newCoordinates,
        totalMiles: newTotalMiles,
        previousCoordinates: [...this.state.previousCoordinates, this.state.lastRecordedCoordinates],
      })
    };
  }

  renderLastCheckStats() {
    if (this.state.lastCheckStats) {
      const {
        averagePace,
        checkPace,
        paceDuringCheck,
        checkPacePercent,
        milesTraveledDuringCheck,
        differential,
        pointsEarned,
      } = this.state.lastCheckStats;

      return (<Card>
        <CardSection style={styles.cardHeader}>
          <Text style={styles.headerText}>RUN STATS</Text>
        </CardSection>
        <CardSection>
          <Text>Average Pace: {averagePace} min/mi</Text>
        </CardSection>
        <CardSection>
          <Text>Miles during check: {milesTraveledDuringCheck}</Text>
        </CardSection>
        <CardSection>
          <Text>Pace during check: {paceDuringCheck}</Text>
        </CardSection>
        <CardSection>
          <Text>Check Pace: {checkPace} min/mi</Text>
        </CardSection>
        <CardSection>
          <Text>% Pace Increase: {checkPacePercent}%</Text>
        </CardSection>
        <CardSection>
          <Text>Differential: {differential}</Text>
        </CardSection>
        <CardSection>
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
      <ScrollView style={styles.container}>
        <Card>
          <CardSection style={styles.cardHeader}>
            <Text style={styles.headerText}>RUN STATS</Text>
          </CardSection>
          <CardSection>
            <Text>
              Current Pace: {convertSecondsPerMileToPaceString(
              this.state.lastRecordedCoordinates.pace
              ) + ' min/mi'}
            </Text>
          </CardSection>
          <CardSection>
            <Text>
              Average Pace: {convertSecondsPerMileToPaceString(
                Math.floor(this.state.totalSeconds / this.state.totalMiles)
                ) + ' min/mi'}
            </Text>
          </CardSection>
          <CardSection>
            <Text>
              Total Distance: {this.state.totalMiles}
            </Text>
          </CardSection>
          <CardSection>
            <Text>
              Time: {this.state.totalSeconds}
            </Text>
          </CardSection>
          <CardSection>
            <Text>
              Status: {this.state.location}
            </Text>
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
            <Button
              onPress={() => this.beginCheck(0)}
              // disabled={this.state.previousCoordinates.length === 0}
              >
              +0 CHECK
  					</Button>
          </CardSection>
          <CardSection>
            <Button
              onPress={() => this.beginCheck(1)}
              // disabled={this.state.previousCoordinates.length === 0}
              >
              +1 CHECK
  					</Button>
          </CardSection>
          <CardSection>
            <Button
              onPress={() => this.beginCheck(2)}
              // disabled={this.state.previousCoordinates.length === 0}
              >
              +2 CHECK
  					</Button>
          </CardSection>
          <CardSection>
            <Button
              onPress={() => this.beginCheck(-1)}
              // disabled={this.state.previousCoordinates.length === 0}
              >
              -1 CHECK
  					</Button>
          </CardSection>
          <CardSection>
            <Button
              onPress={() => this.beginCheck(-2)}
              // disabled={this.state.previousCoordinates.length === 0}
              >
              -2 CHECK
  					</Button>
          </CardSection>
        </Card>
      </ScrollView>
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