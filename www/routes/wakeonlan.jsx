import React from 'react';

class WakeOnLan extends React.Component {
    constructor (props) {
        super (props);
    }
    render () {
        document.title = 'Home Control';
        return (
            <main>
                wakeonlan
            </main>
        );
    }
}

export default WakeOnLan;