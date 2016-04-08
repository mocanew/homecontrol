import React from 'react';
import MaterialButton from './materialButton.jsx';
import '../scss/common.scss';
import '../scss/header.scss';
import classNames from 'classnames';

class Home extends React.Component {
    constructor (props) {
        super(props);
        this.toggleMenu = this.toggleMenu.bind(this);
        this.swipedLeft = this.swipedLeft.bind(this);
        this.swipedRight = this.swipedRight.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.state = {
            menu: false,
            collapse: true
        };
    }
    toggleMenu () {
        this.setState({
            menu: !this.state.menu
        });
    }
    swipedLeft () {
        this.setState({
            menu: false
        });
    }
    swipedRight () {
        this.setState({
            menu: true
        });
    }
    handleResize () {
        if (window.innerWidth > 992) {
            this.setState({
                collapse: false
            });
        }
        else {
            this.setState({
                collapse: true
            });
        }
    }
    componentDidMount () {
        window.addEventListener('resize', this.handleResize);
        this.handleResize();
    }
    componentWillUnmount () {
        window.removeEventListener('resize', this.handleResize);
    }
    render () {
        var classes = classNames({
            menuWrapper: true,
            big: !this.state.collapse,
            open: this.state.collapse && this.state.menu
        });

        return (
            <div className={classes}>
                <nav className="vertical">
                    <div className="logo">
                        Eureka
                    </div>
                    <ul>
                        <li>Test</li>
                        <li>Test</li>
                        <li>Test</li>
                        <li>Test</li>
                    </ul>
                </nav>
                <nav className="horizontal">
                    <MaterialButton buttonStyle="flat iconBtn menu" classes="hamburger" onClick={this.toggleMenu}></MaterialButton>
                    <div className="pageTitle">
                        Titlu pagina > Breadcrumbs
                    </div>
                </nav>
                <div className="backdrop" onClick={this.toggleMenu}></div>
            </div>
        );
    }
}

export default Home;