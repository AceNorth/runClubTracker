import React from 'react';
import { Scene, Router, Actions } from 'react-native-router-flux';
import LoginForm from './components/LoginForm';
import RunList from './components/RunList';
import Dashboard from './components/Dashboard';

const RouterComponent = () => {
	return (
		<Router>
			<Scene>
				<Scene key='main' hideNavBar={true}>
					<Scene 
						key="dashboard" 
						component={ Dashboard }
						onRight={() => Actions.runList()} 
						rightTitle="Previous Runs"
					/>
					<Scene 
						key="runList" 
						component={ RunList } 
						title="Runs"
						onLeft={() => Actions.dashboard()}
						leftTitle="Dashboard"
					/>
				</Scene>
			</Scene>
		</Router>
	);
};

export default RouterComponent;

