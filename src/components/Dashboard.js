import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Text, View } from 'react-native';
import { Card, CardSection } from './common';

class Dashboard extends Component {

  render() {
    return (
      <View style={styles.container}>
        <Card>
          <CardSection style={styles.cardHeader}>
            <Text style={styles.headerText}>HELLO</Text>
          </CardSection>
          <CardSection>
            <Text>Here's some stuff</Text>
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