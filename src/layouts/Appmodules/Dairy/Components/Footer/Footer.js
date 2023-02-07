import React from 'react';
import insta from './insta.png';
import web from './web.png';

class Footer extends React.Component {

    render() {
		return <center> 
                    <b>Designed by </b>| <img height="20" width="20" src={web} alt="portfolio" /> <a target="_blank" href="https://kaletushar222.github.io/portfolio">Portfolio/a> | <img height="20" width="20" src={insta} alt="instagram" /> <a target="_blank" href="https://www.instagram.com/tu__shark/">Tushar Kale</a>
                </center>
	}
}
export default Footer