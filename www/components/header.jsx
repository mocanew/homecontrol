import React from 'react';
import {Button} from 'material-react';
import '../scss/common.scss';
import '../scss/header.scss';
import classnames from 'classnames';
import { Link } from 'react-router';

class Header extends React.Component {
    constructor(props) {
        super(props);
        this.toggleMenu = this.toggleMenu.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.state = {
            menu: false,
            collapse: true,
            edit: false
        };
        this.sendSaveEvent = this.sendSaveEvent.bind(this);
        this.sendEditEvent = this.sendEditEvent.bind(this);
        this.sendCancelEvent = this.sendCancelEvent.bind(this);
    }
    toggleMenu() {
        this.setState({
            menu: !this.state.menu
        });
    }
    handleResize() {
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
    sendEditEvent() {
        this.setState({
            edit: true
        });
        window.HomeControl.emit('edit', true);
    }
    sendSaveEvent() {
        this.setState({
            edit: false
        });
        window.HomeControl.emit('save', true);
        window.HomeControl.emit('edit', false);
    }
    sendCancelEvent() {
        this.setState({
            edit: false
        });
        window.HomeControl.emit('edit', false);
    }
    componentDidMount() {
        window.addEventListener('resize', this.handleResize);
        this.handleResize();
    }
    componentWillUnmount() {
        window.removeEventListener('resize', this.handleResize);
    }
    render() {
        var classes = classnames({
            menuWrapper: true,
            big: !this.state.collapse,
            open: this.state.collapse && this.state.menu
        });
        var saveClasses = classnames({
            edit: true,
            save: true,
            out: !this.state.edit
        });
        var cancelClasses = classnames({
            edit: true,
            out: !this.state.edit
        });
        var editClasses = classnames({
            edit: true,
            out: this.state.edit
        });

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
                    <Button buttonStyle="flat iconBtn menu" classes="hamburger" onClick={this.toggleMenu}></Button>
                    <div className="pageTitle">
                        {this.props.documentTitle}
                    </div>
                    <Button classes={saveClasses} onClick={this.sendSaveEvent}>
                        <i className="fa fa-fw fa-floppy-o" />
                    </Button>
                    <Button classes={editClasses} onClick={this.sendEditEvent}>
                        <i className="fa fa-fw fa-pencil" />
                    </Button>
                    <Button classes={cancelClasses} onClick={this.sendCancelEvent}>
                        <i className="fa fa-fw fa-times" />
                    </Button>
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