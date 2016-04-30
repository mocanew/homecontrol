import React from 'react';
import Card from '../components/card.jsx';
import '../scss/wakeonlan.scss';

class WakeOnLan extends React.Component {
    constructor (props) {
        super (props);
        this.state = {
            cards: this.props.cards
        };
        this.response = this.response.bind(this);
    }
    response (e) {
        if (typeof e != 'object') return;
        
        if (e.length) {
            for (var i = 0; i < e.length; i++) {
                this.reponse(e[i]);
            }
            return;
        }
        
        console.log('Wol response', e);
        var temp = this.state.cards;
        
        for (var w = 0; w < temp.length; w++) {
            if (temp[w].ip != e.ip && temp[w].mac != e.mac) continue;
            temp[w].power = e.isAlive;
        }
        this.setState({
            cards: temp
        });
    }
    error (e) {
        console.error(e);
    }
    componentDidMount() {
        socket.on('WakeOnLan:response', this.response);
        socket.on('WakeOnLan:error', this.error);
        socket.emit('WakeOnLan:state');
    }
    componentWillUnmount() {
        socket.off('WakeOnLan:response', this.response);
    }
    static get defaultProps() {
        return {
            cards: [{
                ip: '192.168.1.1',
                mac: 'FF:FF:FF:FF:FF:F1',
                image: '../images/win7.jpg'
            },
            {
                ip: '192.168.1.115',
                image: '../images/win7.jpg'
            },
            {
                ip: '192.168.1.104',
                mac: 'FF:FF:FF:FF:FF:F2',
                image: '../images/win7.jpg'
            }]
        };
    }
    render () {
        document.title = 'Home Control';
        return (
            <div className="wakeonlan">
                {
                    this.state.cards.map((e, i) => {
                        return <Card power={e.power} name={e.name} ip={e.ip} mac={e.mac} image={e.image} id={i} key={'card' + i} />;
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