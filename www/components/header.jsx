import React from 'react';
import MaterialButton from './materialButton.jsx';
import '../scss/common.scss';
import '../scss/header.scss';
import classNames from 'classnames';
import { Link } from 'react-router';

class Header extends React.Component {
    constructor (props) {
        super(props);
        this.toggleMenu = this.toggleMenu.bind(this);
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
        window.menu = this.state.menu;

        return (
            <div className={classes}>
                <nav className="vertical">
                    <Link to="/" className="logo">
                        Home Control
                    </Link>
                    <div className="links">
                        <Link to="/">Radio Pi</Link>
                        <Link to="/wakeonlan">Wake on Lan</Link>
                        { this.props.admin ? <Link to="/users">Users</Link> : ''}
                    </div>
                </nav>
                <nav className="horizontal">
                    <MaterialButton buttonStyle="flat iconBtn menu" classes="hamburger" onClick={this.toggleMenu}></MaterialButton>
                    <div className="pageTitle">
                        {this.props.documentTitle}
                    </div>
                </nav>
                <div className="backdrop" onClick={this.toggleMenu}></div>
            </div>
        );
    }
}
Header.propTypes = {
    documentTitle: React.PropTypes.string,
    admin: React.PropTypes.bool
};

export default Header;