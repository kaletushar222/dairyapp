import moment from 'moment';
import React from 'react';
import { Button, Col, Form, Row, Table } from 'react-bootstrap';
import './DairyApp.css';
import Footer from './Components/Footer/Footer'

class DairyInvoice extends React.Component {
    
	getInitialState = () =>{
		const d = new Date();
		let month = d.getMonth();
		let object = {
			dairyInvoice :{
				name: '',
				month: month,
				rate: 45,
				billNo: Math.round(Math.random()*1000),
				billDate: moment().format("DD/MM/YYYY"),
				year: new Date().getFullYear(),
				individualDayRates:[],
				totalMilk: 0,
				totalPrice: 0,
				defaultQuantity: 0,
				range: 0.5
			},
			isEditView: true,
			quantities: this.getQuantity(0.5)
        }
		return object
	}

	constructor(props){
        super(props);
        this.state = this.getInitialState()
    }
	
	componentDidMount(){
		this.updateDaysInMonth()
		let prevState = localStorage.getItem("prevState")
		console.log()
		if(prevState){
			prevState = JSON.parse(prevState)
			this.setState(prevState)
		}
		window.addEventListener('beforeunload', this.componentCleanup);
	}

	getQuantity = (range) =>{
		let count = 0
		let quantities = []
		while(count<5){
			count = count + range
			quantities.push(count)
		}
		console.log("quantities : ",quantities)
		return quantities
	}
	getMonthShort =()=>{
		const { dairyInvoice } = this.state
		const month = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sept","Oct","Nov","Dec"];
		return month[dairyInvoice.month];
	}
	componentCleanup = () =>{
		const prevState = JSON.stringify(this.state)
		localStorage.setItem("prevState", prevState)
	}

	handleDairyInvoiceUpdate = (event) =>{
        const { dairyInvoice } = this.state
        dairyInvoice[event.target.name] = event.target.value
        this.setState({
            dairyInvoice: dairyInvoice
        })
    }

	handleDairyInvoiceMonthOrYear = (event) =>{
		const { dairyInvoice } = this.state
        dairyInvoice[event.target.name] = event.target.value
        this.setState({
            dairyInvoice: dairyInvoice
        }, ()=>{
			this.updateDaysInMonth()
		})
	}

	handleDairyInvoiceRate = (event) =>{
		const { dairyInvoice } = this.state
		let rate = 0
		if(event.target.value){
			rate = parseFloat(event.target.value, 10);
			console.log("rate : ", rate)
		}
		dairyInvoice[event.target.name] = parseFloat(rate)
		this.setState({
            dairyInvoice: dairyInvoice
        }, ()=>{
			this.calculateTotal(dairyInvoice)
		})
	}

	updateDaysInMonth = () => {
		const { dairyInvoice } = this.state

		let date = new Date(dairyInvoice.year, dairyInvoice.month, 1);
		let daysInMonth = moment(date).daysInMonth()
		let days = [];
		let count = 1
		while (daysInMonth) {
			let dayWiseRate = {
				id: count,
				date: moment(date).format("DD/MM/YYYY"),
				quantity: 0,
				price: 0
			}
			days.push(dayWiseRate)
			date.setDate(date.getDate() + 1);
			count++
			daysInMonth--
		}

		dairyInvoice['individualDayRates'] = days

		this.setState({
			dairyInvoice: dairyInvoice
		})
	}

	handleIndividualQuantityUpdate = (event, index) =>{
		const { dairyInvoice } = this.state
		dairyInvoice.individualDayRates[index]["quantity"] = parseFloat(event.target.value)
		this.setState({
			dairyInvoice: dairyInvoice
		}, ()=>{
			this.calculateTotal(dairyInvoice)
		})
	}

	handleDefaultQuantityUpdate = (event, index) => {
		const { dairyInvoice } = this.state
		let quantity = 0
		if(event.target.value){
			quantity = parseFloat(event.target.value)
		}
		dairyInvoice['defaultQuantity'] = quantity
		dairyInvoice.individualDayRates.forEach((object, key)=>{
			dairyInvoice.individualDayRates[key]['quantity'] = quantity
		})
		this.calculateTotal(dairyInvoice)
	}

	handleQtyRangeUpdate = (event) =>{
		const { dairyInvoice } = this.state
		let range = parseFloat(event.target.value)
		console.log("range : ", range)
		this.setState({
			quantities: this.getQuantity(range),
			range: range
		}, ()=>{
			this.calculateTotal(dairyInvoice)
		})
	}
	
	toggleEdit = () =>{
		const { isEditView } = this.state
		this.setState({
			isEditView: !isEditView
		})
	}

	calculateTotal = (dairyInvoice) =>{
		let totalPrice = 0
		let totalMilk = 0
		dairyInvoice.individualDayRates.forEach((object, index)=>{
			const price = parseFloat(parseFloat(parseFloat(dairyInvoice.rate) * object.quantity).toFixed(2))
			dairyInvoice.individualDayRates[index]["price"] = price
			totalPrice = totalPrice + price
			totalMilk = totalMilk + object.quantity
		})
		totalPrice = Math.round(parseFloat(totalPrice))
		dairyInvoice['totalPrice'] = totalPrice
		dairyInvoice['totalMilk'] = totalMilk
		this.setState({
			dairyInvoice: dairyInvoice
		})
	}

	downloadInvoice = () => {
		const { dairyInvoice } = this.state
		document.getElementById("hide-btn").style.display = "none"; 
		let title = document.title
		document.title = dairyInvoice.name+'-'+this.getMonthShort()+'-'+dairyInvoice.year		
		window.print();
		document.title = title

		setTimeout(()=>{
			document.getElementById("hide-btn").style.display = "block"; 
		}, 1000);
	}

	componentWillUnmount(){
		this.componentCleanup();
        window.removeEventListener('beforeunload', this.componentCleanup);
	}

	reset = () =>{
		localStorage.removeItem('prevState')
		this.setState(this.getInitialState(),
		()=>{
			this.updateDaysInMonth()
		})
		//this.updateDaysInMonth()
	}

    render() {
		const { isEditView } = this.state
		const renderUI = isEditView? this.getEditView():this.getPrintView()
		return renderUI
	}
	

	getEditView = () =>{
		const { dairyInvoice, quantities, range } = this.state
		let months = moment.months()
		let currentYear = new Date().getFullYear();
		let years = [currentYear-1, currentYear, currentYear+1]
		console.log("edit view quanitties : ", quantities)
  		return (
			<div>
				<div className='dairy-invoice'>
						<div className='border-div'>
							<center><h1>SHRI DATTA DAIRY FARM</h1></center>
							<Row style={{margin: "auto"}}>
									<Form.Control value={ dairyInvoice.name } type="text" placeholder="Enter Customer Name" name="name" onChange={this.handleDairyInvoiceUpdate}/>
							</Row>
							<br/>
							<Row style={{margin: "auto"}}>
								<Col>
									<Form.Label>Month: </Form.Label><br/>
									<Form.Select value={dairyInvoice.month} name="month" onChange={this.handleDairyInvoiceMonthOrYear}> 
										{
											months.map((month, index)=>{
												return <option key={index} value={index}>{month}</option>
											})
										}
									</Form.Select>
								</Col>
								<Col>
									<Form.Label>Year: </Form.Label><br/>
									<Form.Select value={dairyInvoice.year} name="year" onChange={this.handleDairyInvoiceMonthOrYear}> 
										{
											years.map((year, key)=>{
												return <option key={key} value={year}>{year}</option> 	
											})
										}
									</Form.Select>
								</Col>
							</Row>
							<br/>
							<Row style={{margin: "auto"}}>
								<Col>
									<Form.Label>Default Qty </Form.Label>
									<Form.Select name="quantity" value={dairyInvoice.defaultQuantity} onChange={ this.handleDefaultQuantityUpdate }> 
										{
											quantities.map((qty, index)=>{
												return <option key={index} value={qty}>{qty}</option>
											})
										}
									</Form.Select> &nbsp; Ltr
								</Col>
								<Col>
									<Form.Label>Qty Range</Form.Label>
									<Form.Range min="0.25" max="0.5" step="0.25" onChange={ this.handleQtyRangeUpdate } value={ range }/>
								</Col>
							</Row>
							<br/>
							<Row style={{margin: "auto"}}>
								<Col>
									<Form.Label>Rate(Rs.)/Ltr: </Form.Label>
									<Form.Control value={ dairyInvoice.rate } type="text" placeholder="Enter Rate" name="rate" onChange={this.handleDairyInvoiceRate}/>
								</Col>
								<Col>
									
								</Col>
							</Row>
						</div>
						<br/>
						<Table striped bordered hover size="sm">
							<thead>
								<tr>
									<th>Date</th>
									<th>Quantity</th>
									<th>Price</th>
								</tr>
							</thead>
							<tbody>
								{
									dairyInvoice.individualDayRates.map((day, index)=>{
										return <tr key={index}>
											<td>{day.date}</td>
											<td>
												<Form.Select value={day.quantity} name="quantity" onChange={(event)=>{this.handleIndividualQuantityUpdate(event, index)}}> 
													{
														quantities.map((qty, index)=>{
															return <option key={index} value={qty}>{qty}</option>
														})
													}
												</Form.Select> &nbsp; Ltr
											</td>
											<td>{day.price}</td>
										</tr>
									})
								}
								<tr>
									<td><b>Total</b></td>
									<td><b>{ dairyInvoice.totalMilk }</b> Ltr</td>
									<td>Rs. <b>{ dairyInvoice.totalPrice }</b> /-</td>
								</tr>
							</tbody>
						</Table>
				</div>
				<center>
					<Button variant="primary" onClick={ this.toggleEdit }>
						Save
					</Button>
					&nbsp;&nbsp;&nbsp;
					<Button variant="danger" onClick={ this.reset }>
						Reset
					</Button>
					<br/><br/>
					<Footer/>
					<br/><br/>
				</center>
			</div>
  		);
	}

	getPrintView = () =>{
		const { dairyInvoice } = this.state
		let months = moment.months()
  		return (
			<div>
				<div className='dairy-invoice'>
						<div style={{ marginBottom:"8px" }}>
							<center>
								<h1>SHRI DATTA DAIRY FARM</h1>
								<div>Datta Shinde | 7385063457 </div>
							</center>
							<Row style={{margin: "auto"}}>
								<Form.Label>Name: <b>{ dairyInvoice.name }</b></Form.Label>
							</Row>
							<Row style={{margin: "auto"}}>
								<Form.Label>Month: <b>{months[dairyInvoice.month] +'-'+dairyInvoice.year}</b></Form.Label><br/>
							</Row>
							<Row style={{margin: "auto"}}>
								<Form.Label>Rate(Rs.)/Ltr: <b>{ dairyInvoice.rate }</b>/-</Form.Label>
							</Row>
						</div>
						<Table striped bordered hover size="sm">
							<thead>
								<tr>
									<th>Date</th>
									<th>Quantity</th>
									<th>Price</th>
								</tr>
							</thead>
							<tbody>
								{
									dairyInvoice.individualDayRates.map((day, index)=>{
										return <tr key={index}>
											<td>{day.date}</td>
											<td>{day.quantity}</td>
											<td>{day.price}</td>
										</tr>
									})
								}
								<tr>
									<td><b>Total</b></td>
									<td><b>{ dairyInvoice.totalMilk }</b> Ltr</td>
									<td>Rs. <b>{ dairyInvoice.totalPrice }</b> /-</td>
								</tr>
							</tbody>
						</Table>
				</div>
				<center id='hide-btn'>
					<div>
						<Button variant="primary" onClick={ this.downloadInvoice }>
							Download
						</Button>
						&nbsp;&nbsp;
						<Button variant="secondary" onClick={ this.toggleEdit }>
							Edit
						</Button>
						&nbsp;&nbsp;&nbsp;
						<Button variant="danger" onClick={ this.reset }>
							Reset
						</Button>
					</div>
				</center>
				<br/>
					<center>
						<Footer/>
					</center>
				<br/>
			</div>
  		);
	}
}

export default DairyInvoice