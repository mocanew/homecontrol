import { createStore } from 'redux';

var initialState = {
    edit: false
};

function reducer(state = initialState, action) {
    console.log(state, action);
    switch (action.type) {
        case 'edit':
            return {
                edit: action.value
            };
        default:
            return state;
    }
}

var store = createStore(reducer);

store.dispatch({
    type: 'edit'
});

export default store;