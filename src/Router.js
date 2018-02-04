import React from 'react';
import { Scene, Router, Actions } from 'react-native-router-flux';
import LoginForm from './components/LoginForm';
import RunList from './components/RunList';
import Dashboard from './components/Dashboard';

const RouterComponent = () => {
	return (
		<Router>
			<Scene>
				<Scene hideNavBar={true}>
					<Scene key="auth">
						<Scene key="login"
							component={ LoginForm }
							hideNavBar={true}
							/>
					</Scene>
				</Scene>
				<Scene key='main'>
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

