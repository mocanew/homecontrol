import React from 'react';
import Card from '../components/wol-computer.jsx';
import '../scss/wakeonlan.scss';

class WakeOnLan extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            cards: this.props.cards
        };
        this.response = this.response.bind(this);
        this.addCard = this.addCard.bind(this);
        this.remove = this.remove.bind(this);
    }
    addCard(e) {
        var temp = this.state.cards;
        temp.push(e);
        this.setState({
            cards: temp
        });
    }
    response(e) {
        if (typeof e != 'object') return;

        if (e.length) {
            for (var i = 0; i < e.length; i++) {
                this.reponse(e[i]);
            }
            return;
        }

        e.ip = e.ip && e.ip.length ? e.ip : undefined;
        e.mac = e.mac && e.mac.length ? e.mac : undefined;

        console.log('Wol response', e);
        var temp = this.state.cards;

        for (var w = 0; w < temp.length; w++) {
            if (temp[w].ip != e.ip && temp[w].mac != e.mac) {
                temp[w].direct = false;
                continue;
            }
            temp[w].power = e.isAlive;
            temp[w].direct = true;
        }
        this.setState({
            cards: temp
        });
    }
    error(e) {
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
            cards: [
                {
                    ip: '192.168.0.1',
                    mac: 'FF:FF:FF:FF:FF:F1',
                    image: 'http://localhost:8090/www/images/win7.jpg'
                },
                {
                    ip: '192.168.1.115',
                    image: 'http://localhost:8090/www/images/linux.png'
                },
                {
                    ip: '192.168.0.102',
                    mac: 'FF:FF:FF:FF:FF:F2',
                    image: 'http://localhost:8090/www/images/win7.jpg'
                }
            ]
        };
    }
    remove(e) {
        return function () {
            console.log(e);
            var temp = this.state.cards;

            for (var w = 0; w < temp.length; w++) {
                if (temp[w].ip != e.ip && temp[w].mac != e.mac) continue;
                temp.splice(w, 1);
            }
            this.setState({
                cards: temp
            });
        }.bind(this);
    }
    render() {
        document.title = 'Home Control';
        return (
            <div className="wakeonlan">
                <Card onSave={this.addCard} />
                {
                    this.state.cards.map((e, i) => {
                        return <Card remove={this.remove} direct={e.direct} power={e.power} name={e.name} ip={e.ip} mac={e.mac} image={e.image} id={i + 1} key={'card' + i} />;
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