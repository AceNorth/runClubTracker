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
      totalMinutes: 0,
      currentCheckValue: 0,
      totalPoints: 0,
      totalMiles: 0,
      lastRecordedCoordinates: {
        pace: null,
      },
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
    let newTotalSeconds = this.state.totalSeconds + 1;
    let newTotalMinutes = this.state.totalMinutes;
    if (newTotalSeconds === 60) {
      newTotalSeconds = 0;
      newTotalMinutes++;
    }
    this.setState({
      totalSeconds: newTotalSeconds,
      totalMinutes: newTotalMinutes
    });
  }

  updatePoints(points) {
    this.setState({
      totalPoints: this.state.totalPoints + points,
    })
  }

  generateNumber(max) {
    this.setState({
      currentCheckValue: Math.floor(Math.random() * Math.floor(max)) + 1,
    })
  }

  determineCheckBackground() {
    if (this.state.currentCheckValue > 74) {
      return 'green';
    } else if (this.state.currentCheckValue > 49) {
      return 'yellow';
    } else {
      return 'red';
    }
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
      desiredAccuracy: 0, // equal to BackgroundGeolocation.HIGH_ACCURACY
      stationaryRadius: 20,
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

  render() {
    return (
      <ScrollView contentContainerStyle={styles.body}>
        <Card style={{ flex: 1 }}>
          <CardSection style={{
              backgroundColor: this.determineCheckBackground()
            }}>
            <Text style={{
              fontSize: 30,
              fontWeight: 'bold',
            }}>
            CURRENT VALUE: {this.state.currentCheckValue}
            </Text>
          </CardSection>
          <CardSection>
            <Button
              onPress={() => this.generateNumber(100)}
              disabled={false}
              >
              GENERATE NUMBER
            </Button>
          </CardSection>
        </Card>
        <Card style={{ flex: 1 }}>
          <CardSection>
            <Text style={{
                fontSize: 30,
                fontWeight: 'bold',
              }}>
              Points: {this.state.totalPoints}
            </Text>
          </CardSection>
          <CardSection>
            <Button
              onPress={() => this.updatePoints(1)}
              disabled={false}
              >
              +1 pt
            </Button>
            <Button
              onPress={() => this.updatePoints(3)}
              disabled={false}
              >
              +3 pts
            </Button>
            <Button
              onPress={() => this.updatePoints(5)}
              disabled={false}
              >
              +5 pts
            </Button>
          </CardSection>
          <CardSection style={{padding: 15}}>
            <Button
              onPress={() => this.updatePoints(-1)}
              disabled={false}
              >
              -1 pt
            </Button>
            <Button
              onPress={() => this.updatePoints(-3)}
              disabled={false}
              >
              -3 pts
            </Button>
            <Button
              onPress={() => this.updatePoints(-5)}
              disabled={false}
              >
              -5 pts
            </Button>
          </CardSection>
        </Card>
        <Card>
          <CardSection>
            <Text
              style={{
              fontSize: 30,
              fontWeight: 'bold',
            }}>
              Time: {("0" + this.state.totalMinutes).slice(-2)}:{("0" + this.state.totalSeconds).slice(-2)}
            </Text>
          </CardSection>
          <CardSection>
            <Button onPress={this.toggleTimer}>
              START/STOP RUN
            </Button>
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
              Overall Average Pace: {convertSecondsPerMileToPaceString(
                Math.floor(this.state.totalSeconds / this.state.totalMiles)
                ) + ' min/mi'}
            </Text>
          </CardSection>
          <CardSection>
            <Text>
              Total Distance: {this.state.totalMiles}
            </Text>
          </CardSection>
        </Card>
      </ScrollView>
    );
  }
}

const styles = {
  container: {
    flex: 1,
  },
  body: {
    flex: 1,
    backgroundColor: '#e191ff',
    justifyContent: 'space-around'
  },
  cardHeader: {
    justifyContent: 'center',
    backgroundColor: "#000"
  },
  headerText: {
    color: '#fff',
    fontWeight: 'bold'
  },
}

const mapStateToProps = state => {
  return { };
};

export default connect(mapStateToProps, {})(Dashboard);