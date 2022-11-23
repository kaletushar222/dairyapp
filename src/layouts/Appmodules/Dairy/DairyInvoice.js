import React from 'react';
import { Table, Row, Col, Form, Button } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import './DairyApp.css'
import moment from 'moment';

class DairyInvoice extends React.Component {
    
	getInitialState = () =>{
		const d = new Date();
		let month = d.getMonth();
		let object = {
			dairyInvoice :{
				name: '',
				month: month,
				rate: 0,
				billNo: Math.round(Math.random()*1000),
				billDate: moment().format("DD/MM/YYYY"),
				year: '2022',
				individualDayRates:[],
				totalMilk: 0,
				totalPrice: 0
			},
			isEditView: true
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
			rate = parseFloat(event.target.value)
		}
		console.log(event.target.value, '------>', rate)
		dairyInvoice[event.target.name] = parseFloat(rate)
		this.setState({
            dairyInvoice: dairyInvoice
        }, ()=>{
			this.calculateTotal()
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
			this.calculateTotal()
		})
	}
	
	toggleEdit = () =>{
		const { isEditView } = this.state
		this.setState({
			isEditView: !isEditView
		})
	}

	calculateTotal = () =>{
		const { dairyInvoice } = this.state
		let totalPrice = 0
		let totalMilk = 0
		dairyInvoice.individualDayRates.map((object, index)=>{
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
		document.title = dairyInvoice.name+'-'+dairyInvoice.month+'-'+dairyInvoice.year		
		window.print();
		document.title = document.title
		document.getElementById("hide-btn").style.display = "block"; 
	}

	componentWillUnmount(){
		this.componentCleanup();
        window.removeEventListener('beforeunload', this.componentCleanup);
	}

	reset = () =>{
		localStorage.removeItem('prevState')
		this.setState(this.getInitialState())
		//this.updateDaysInMonth()
	}

    render() {
		const { isEditView } = this.state
		const renderUI = isEditView? this.getEditView():this.getPrintView()
		return renderUI
	}
	

	getEditView = () =>{
		const { dairyInvoice } = this.state
		let months = moment.months()
  		return (
			<div>
				<div className='dairy-invoice'>
						<div className='border-div'>
							<center><h1>SHRI DATTA DAIRY FARM</h1></center>
							<Row style={{margin: "auto"}}>
									<Form.Label>Name: </Form.Label>
									<Form.Control value={ dairyInvoice.name } type="text" placeholder="Enter Name" name="name" onChange={this.handleDairyInvoiceUpdate}/>
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
										<option value="2022">2022</option>
										<option value="2023">2023</option>
									</Form.Select>
								</Col>
							</Row>
							<br/>
							<Row style={{margin: "auto"}}>
								<Form.Label>Rate(Rs.): </Form.Label>
								<Form.Control value={ dairyInvoice.rate } type="number" placeholder="Enter Rate" name="rate" onChange={this.handleDairyInvoiceRate}/>
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
												<option value="0">0</option>
													<option value="0.5">0.5</option>
													<option value="1">1</option>
													<option value="1.5">1.5</option>
													<option value="2">2</option>
													<option value="2.5">2.5</option>
													<option value="3">3</option>
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
					<br/><br/><br/><br/>
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
						<div className='border-div'>
							<center><h1>SHRI DATTA DAIRY FARM</h1></center>
							<br/>
							<Row style={{margin: "auto"}}>
								<Form.Label>Name: <b>{ dairyInvoice.name }</b></Form.Label>
							</Row>
							<Row style={{margin: "auto"}}>
								<Form.Label>Month: <b>{months[dairyInvoice.month] +'-'+dairyInvoice.year}</b></Form.Label><br/>
							</Row>
							<Row style={{margin: "auto"}}>
								<Form.Label>Rate (Rs.): <b>{ dairyInvoice.rate }</b>/-</Form.Label>
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
				<br/>
					<center>
						<div id='hide-btn'>
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
				<br/><br/><br/><br/>
			</div>
  		);
	}
}

export default DairyInvoice