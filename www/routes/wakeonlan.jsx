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
        socket.emit('WakeOnLan:save', e);
    }
    response(e) {
        if (e && e.hosts) e = e.hosts;
        if (typeof e != 'object' || !e) return;

        if (e.length) {
            for (var i = 0; i < e.length; i++) {
                this.response(e[i]);
            }
            return;
        }

        e.ip = e.ip && e.ip.length ? e.ip : undefined;
        e.mac = e.mac && e.mac.length ? e.mac : undefined;

        console.log('Wol response', e);
        var temp = this.state.cards;

        if (e.type) {
            for (var w = 0; w < temp.length; w++) {
                if (temp[w].ip != e.ip && temp[w].mac != e.mac) {
                    temp[w].direct = false;
                    continue;
                }
                temp[w].power = e.isAlive;
                temp[w].direct = true;
            }
        }
        else if (e.ip || e.mac) {
            temp.push(e);
        }
        this.setState({
            cards: temp
        });
    }
    componentDidMount() {
        socket.on('WakeOnLan:response', this.response);
        socket.emit('WakeOnLan:list');
    }
    componentWillUnmount() {
        socket.off('WakeOnLan:response', this.response);
    }
    static get defaultProps() {
        return {
            cards: []
        };
    }
    remove(e) {
        return (function () {
            console.log(e);
            var temp = this.state.cards;

            socket.emit('WakeOnLan:remove', {
                ip: e.ip,
                mac: e.mac
            });
            for (var w = 0; w < temp.length; w++) {
                if (temp[w].ip != e.ip || temp[w].mac != e.mac) continue;
                temp.splice(w, 1);
                w--;
            }
            this.setState({
                cards: temp
            });
        }).bind(this);
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