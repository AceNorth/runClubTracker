import React, {Component} from 'react';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import { View, Text } from 'react-native';
import reducers from './reducers';
import firebase from 'firebase';
import ReduxThunk from 'redux-thunk';
import Router from './Router';

export default class App extends Component {

	componentWillMount() {
		firebase.initializeApp({
			apiKey: "AIzaSyAaPdIK4Vm1LSoTalq23ptYAD972NMtyfY",
			authDomain: "dndruntracker.firebaseapp.com",
			databaseURL: "https://dndruntracker.firebaseio.com",
			projectId: "dndruntracker",
			storageBucket: "dndruntracker.appspot.com",
			messagingSenderId: "392568637101"
		})
	}

	render(){
		return (
			<Provider store={createStore(reducers, {}, applyMiddleware(ReduxThunk))}>
				<Router />
			</Provider>
		);
	}
}