import { combineReducers } from 'redux';
import AuthReducer from './AuthState';
import RunReducer from './RunState';

export default combineReducers({
	auth: AuthReducer,
	runs: RunReducer,
});