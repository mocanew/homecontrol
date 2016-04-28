import React from 'react';
import Card from '../components/card.jsx';
import '../scss/wakeonlan.scss';

class WakeOnLan extends React.Component {
    constructor (props) {
        super (props);
        this.state = {};
    }
    static get defaultProps() {
        return {
            cards: [{
                name: 'Computer 1',
                ip: '192.168.0.100',
                on: false,
                image: '../images/win7.jpg'
            }]
        };
    } 
    render () {
        document.title = 'Home Control';
        return (
            <div className="wakeonlan">
                {
                    this.props.cards.map((e, i) => {
                        return <Card title={e.name} subtitle={e.ip} image={e.image} key={'card' + i} />;
                    })
                }
            </div>
        );
    }
}
WakeOnLan.propTypes = {
    cards: React.PropTypes.array
};

export default WakeOnLan;