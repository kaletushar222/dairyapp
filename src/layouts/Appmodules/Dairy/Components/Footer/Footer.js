import React from 'react';
import insta from './insta.png';

class Footer extends React.Component {

    render() {
		return <center> 
                    <b>Designed by </b> | <img height="20" width="20" src={insta} alt="instagram" /> <a target="_blank" href="https://www.instagram.com/tu__shark/">Tushar Kale</a>
                </center>
	}
}
export default Footer