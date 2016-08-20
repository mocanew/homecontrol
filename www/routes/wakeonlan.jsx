import React from 'react';
import Card from '../components/wol-computer.jsx';
import '../scss/wakeonlan.scss';

class WakeOnLan extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            cards: this.props.cards ? this.props.cards : []
        };
        this.list = this.list.bind(this);
        this.addCard = this.addCard.bind(this);
        this.remove = this.remove.bind(this);
    }
    addCard(e) {
        var temp = this.state.cards;
        var ok = true;
        for (var u = 0; u < temp.length; u++) {
            temp[u].mac = temp[u].mac && temp[u].mac.length ? temp[u].mac.toUpperCase() : temp[u].mac;
            if ((temp[u].ip && temp[u].ip == e.ip) || (temp[u].mac && temp[u].mac == e.mac)) {
                ok = false;
                break;
            }
        }
        if (!ok) return;
        temp.push(e);
        this.setState({
            cards: temp
        });
        socket.emit('WakeOnLan:save', e);
    }
    list(e) {
        this.setState({
            cards: e.hosts ? e.hosts : []
        });
    }
    componentDidMount() {
        socket.on('WakeOnLan:listResponse', this.list);
        socket.emit('WakeOnLan:list');
    }
    componentWillUnmount() {
        socket.off('WakeOnLan:listResponse', this.list);
    }
    static get defaultProps() {
        return {
            cards: []
        };
    }
    remove(e) {
        return (function () {
            socket.emit('WakeOnLan:remove', e);
        }).bind(this);
    }
    render() {
        return (
            <div className="wakeonlan">
                <Card onSave={this.addCard} />
                {
                    this.state.cards.map((e, i) => {
                        return <Card original={e} remove={this.remove} direct={e.direct} power={e.power} name={e.name} ip={e.ip} mac={e.mac} image={e.image} id={i + 1} key={e._id} />;
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