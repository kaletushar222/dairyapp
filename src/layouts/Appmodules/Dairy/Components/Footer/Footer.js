import React from 'react';
import insta from './insta.png';
import web from './web.png';

class Footer extends React.Component {

    render() {
		return <center> 
                    <b>Designed by </b>| <img height="20" width="20" src={web} alt="portfolio" /> <a target="_blank" href="https://kaletushar222.github.io/portfolio">Tushar Kale</a> | <img height="20" width="20" src={insta} alt="instagram" /> <a target="_blank" href="https://www.instagram.com/t.u.s.h.a.r_k/">t.u.s.h.a.r_k</a>
                </center>
	}
}
export default Footer