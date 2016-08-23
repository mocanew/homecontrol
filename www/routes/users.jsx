import React from 'react';
import {Button, Input} from 'material-react';
import '../scss/users.scss';

class UserPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            users: []
        };
    }
    componentDidMount() {
        $.get('/api/users', (e) => {
            this.setState({
                users: e
            });
        });
    }
    render() {
        return (
            <div className="table-responsive">
                <table className="table table-bordered" id="table">
                    <thead>
                        <tr>
                            <th></th>
                            <th>Password</th>
                            <th>Permissions</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            this.state.users.map((user, index) => <tr key={index} >
                                <td><Input name="username" title="Username" value={user.username} /></td>
                                <td><Input name="password" title="Password (unchanged)" /></td>
                                <td>{user.permissionLevel}</td>
                                <td>
                                    <Button buttonStyle="flat"><i className="fa fa-fw fa-trash"></i></Button>
                                </td>
                            </tr>)
                        }
                    </tbody>
                </table>
            </div>
        );
    }
}

export default UserPage;