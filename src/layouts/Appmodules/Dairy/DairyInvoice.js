import moment from 'moment';
import React from 'react';
import { Button, Col, Form, Row, Table } from 'react-bootstrap';
import './DairyApp.css';
import Footer from './Components/Footer/Footer'
import ForwardIcon from '../../../images/forward.png'
import BuffaloImage from '../../../images/buffalo.png'
import $ from "jquery";

class DairyInvoice extends React.Component {
    
	getInitialState = () =>{
		const d = new Date();
		d.setMonth(d.getMonth() - 1);
		let month = d.getMonth();

		let object = {
			dairyInvoice :{
				name: '',
				month: month,
				rate: 45,
				billNo: Math.round(Math.random()*1000),
				billDate: moment().format("DD/MM/YYYY"),
				year: new Date().getFullYear(),
				individualProducts:[],
				totalMilk: 0,
				totalPrice: 0,
				defaultQuantity: 0,
				isAdvance : false,
				balanceAmount : 0,
				totalPayable: 0
			},
			isEditView: true,
			quantities: [0, 0.5, 1, 1.5, 2]
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
		if(prevState){
			prevState = JSON.parse(prevState)
			this.setState(prevState)
		}
		window.addEventListener('beforeunload', this.componentCleanup);

		window.onafterprint = function(){
			$("#hide-btn").show()
		 }
	}

	getMonthShort =()=>{
		const { dairyInvoice } = this.state
		const month = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sept","Oct","Nov","Dec"];
		return month[dairyInvoice.month];
	}
	componentCleanup = () =>{
		delete this.state.quantities
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
		}
		dairyInvoice[event.target.name] = parseFloat(rate)
		this.setState({
            dairyInvoice: dairyInvoice
        }, ()=>{
			this.calculateTotal(dairyInvoice)
		})

		$("#rate-input").val(rate)
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

		dairyInvoice['individualProducts'] = days

		this.setState({
			dairyInvoice: dairyInvoice
		})
	}

	handleDefaultQuantityUpdate = (event, index) => {
		const { dairyInvoice } = this.state
		let quantity = 0
		if(event.target.value){
			quantity = parseFloat(event.target.value)
		}
		dairyInvoice['defaultQuantity'] = quantity
		dairyInvoice.individualProducts.forEach((object, key)=>{
			dairyInvoice.individualProducts[key]['quantity'] = quantity
		})
		this.calculateTotal(dairyInvoice)
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

		dairyInvoice.individualProducts.forEach((object, index)=>{
			if(!object.isCancelled){
				const price = parseFloat(parseFloat(parseFloat(dairyInvoice.rate) * object.quantity).toFixed(2))
				dairyInvoice.individualProducts[index]["price"] = price
				totalPrice = totalPrice + price
				totalMilk = totalMilk + object.quantity
			}
		})
		totalPrice = Math.round(parseFloat(totalPrice))
		dairyInvoice['totalPrice'] = totalPrice
		dairyInvoice['totalMilk'] = parseFloat(totalMilk.toFixed(2))

		if(dairyInvoice.isAdvance){
			dairyInvoice['totalPayable'] = parseFloat((dairyInvoice.totalPrice - dairyInvoice.balanceAmount).toFixed(2))
		}
		else{
			dairyInvoice['totalPayable'] = parseFloat((dairyInvoice.totalPrice + dairyInvoice.balanceAmount).toFixed(2))
		}

		this.setState({
			dairyInvoice: dairyInvoice
		})
	}

	downloadInvoice = () => {
		const { dairyInvoice } = this.state
		$("#hide-btn").hide()
		let title = document.title
		document.title = dairyInvoice.name+'-'+this.getMonthShort()+'-'+dairyInvoice.year	
		window.print();
		document.title = title
	}

	componentWillUnmount(){
		this.componentCleanup();
        window.removeEventListener('beforeunload', this.componentCleanup);
	}

	handleCustomQty = (event) => {
		let quantity = event.target.value
		this.setState({
			customQty: parseFloat(quantity)
		})
	}
	addQuantity = () =>{
		const { customQty, quantities } = this.state
		if(!customQty || quantities.includes(customQty)){
			return alert("Quantity is already present")
		}
		quantities.push(customQty)
		quantities.sort((a, b) => a - b);
		this.setState({
			customQty: 0,
			quantities: quantities
		})
	}

	handleBalanceAmountSwitch = (event) =>{
		const { dairyInvoice } = this.state
		dairyInvoice.isAdvance = !dairyInvoice.isAdvance
		this.calculateTotal(dairyInvoice)
	}

	handleDairyInvoiceBalanceAmount = (event) =>{
		const { dairyInvoice } = this.state
		
		let balanceAmount = 0 
		if(event.target.value){
			balanceAmount = parseFloat(event.target.value)
		}
		balanceAmount = parseFloat(balanceAmount.toFixed(2))
		dairyInvoice[event.target.name] = parseFloat(balanceAmount)
		this.calculateTotal(dairyInvoice)
		$("#balanceAmount").val(balanceAmount)
	}

	handleIndividualProductUpdate = (event, index) =>{
		const { dairyInvoice } = this.state
		dairyInvoice.individualProducts[index][event.target.name] = parseFloat(event.target.value)
		this.calculateTotal(dairyInvoice)
	}

	cancelIndividualProduct = (event, index) =>{
		const { dairyInvoice } = this.state
		dairyInvoice.individualProducts[index][event.target.name] = event.target.checked
		this.calculateTotal(dairyInvoice)
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
		const { dairyInvoice, quantities, customQty, isAdvance } = this.state
		console.log("dairyInvoice : ", dairyInvoice)
		let months = moment.months()
		let currentYear = new Date().getFullYear();
		let years = [currentYear-1, currentYear, currentYear+1]
		
  		return (
			<div>
				<div className='dairy-invoice'>
						<div className='border-div'>
							<Row style={{margin: "auto"}}>
								<Col>
									<Form.Label>Customer Name: </Form.Label><br/>
									<Form.Control value={ dairyInvoice.name } type="text" placeholder="Enter Customer Name" name="name" onChange={this.handleDairyInvoiceUpdate}/>
								</Col>
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
									<Form.Label style={{display: "block"}}>Add Qty: &nbsp; </Form.Label>
									<Form.Control style={{width: "62%", display: "inline"}} value={ customQty } type="number" placeholder="Quantity" name="Custom Quantity" onChange={this.handleCustomQty}/>
									<img className='custom-button' role="button" onClick={this.addQuantity} height="28" width="28" src={ForwardIcon} alt="add" />
								</Col>
								<Col>
									<Form.Label style={{display: "block"}}>Default Qty:</Form.Label>
									<Form.Select name="quantity" style={{display : "block"}} value={dairyInvoice.defaultQuantity} onChange={ this.handleDefaultQuantityUpdate }> 
										{
											quantities.map((qty, index)=>{
												return <option key={index} value={qty}>{qty}</option>
											})
										}
									</Form.Select>
								</Col>
							</Row>
							<br/>
							<Row style={{margin: "auto"}}>
								<Col xs="2">
									<Form.Label>B/A</Form.Label>
									<Form.Check 
										type="switch"
										id="custom-switch"
										checked={dairyInvoice.isAdvance}
										onChange={this.handleBalanceAmountSwitch}
									/>
								</Col>
								<Col xs="5">
									<Form.Label> { dairyInvoice.isAdvance?"Advance" : "Balance" } </Form.Label>
									<Form.Control value={ dairyInvoice.balanceAmount } type="number" placeholder={ dairyInvoice.isAdvance?"Advance" : "Balance" } id="balanceAmount" name="balanceAmount" onChange={this.handleDairyInvoiceBalanceAmount}/>
								</Col>

								<Col xs="5">
									<Form.Label>Rate(Rs.)/Ltr: </Form.Label>
									<Form.Control value={ dairyInvoice.rate } type="number" placeholder="Enter Rate" name="rate" id="rate-input" onChange={this.handleDairyInvoiceRate}/>
								</Col>
							</Row>
							<br/>
						</div>
						<br/>
						<Table striped bordered hover size="sm">
							<thead>
								<tr>
									<th>Date</th>
									<th>Quantity</th>
									<th>Price</th>
									<th>Cancel</th>
								</tr>
							</thead>
							<tbody>
								{
									dairyInvoice.individualProducts.map((product, index)=>{
										return <tr key={index}>
											<td style={{textDecoration: product.isCancelled?"line-through":"none" }}>{product.date}</td>
											<td>
												<Form.Select value={product.quantity} name="quantity" onChange={(event)=>{this.handleIndividualProductUpdate(event, index)}}> 
													{
														quantities.map((qty, index)=>{
															return <option key={index} value={qty}>{qty}</option>
														})
													}
												</Form.Select>
											</td>
											<td style={{textAlign: "right", textDecoration: product.isCancelled?"line-through":"none" }}>{product.price}</td>
											<td>
												<Form.Check 
													name="isCancelled"
													type="switch"
													id="cancel-switch"
													checked={product.isCancelled}
													onChange={(event)=>{this.cancelIndividualProduct(event, index)}}
												/>
											</td>
										</tr>
									})
								}
								<tr>
									<td><b>Total</b></td>
									<td style={{textAlign: "right"}}><b>{ dairyInvoice.totalMilk }</b> Ltr</td>
									<td style={{textAlign: "right"}}><b>{ dairyInvoice.totalPrice }</b></td>
								</tr>
								{
									dairyInvoice.balanceAmount ?
									<>
										<tr>
											<td colspan="2">{ dairyInvoice.isAdvance ? "Previous Advance" : "Previous Balance"}</td>
											<td style={{textAlign: "right"}}>{ dairyInvoice.isAdvance ? "-" : "+"} { dairyInvoice.balanceAmount }</td>
										</tr>
										<tr>
											<td colspan="2"><b>Total Payable</b></td>
											<td style={{textAlign: "right"}}><b>{ dairyInvoice.totalPayable }</b></td>
										</tr>
									</> 
									: <></>

								}
							</tbody>
						</Table>
						<br/>
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
								<div className='owner'>Datta Shinde | 7385063457 </div>
							</center>
							<br/>
							<div style={{width: "100%", display: "flex"}}>
								<div style={{width: "80%"}}>
									<Row style={{margin: "auto"}}>
										<Form.Label>Name: <b>{ dairyInvoice.name }</b></Form.Label>
									</Row>
									<Row style={{margin: "auto"}}>
										<Col>
											<Form.Label>Month: <b>{months[dairyInvoice.month] +'-'+dairyInvoice.year}</b></Form.Label><br/>
										</Col>
										<Col>
											<Form.Label>Rate/Ltr: <b>{ dairyInvoice.rate }</b>/-</Form.Label>
										</Col>
									</Row>
								</div>
								<div style={{width: "20%"}}>
									<img height="40" width="40" style={{float: "right"}} src={BuffaloImage} alt="Buffalo" />
								</div>
							</div>
							
						</div>
						<Table bordered size="sm">
							<thead>
								<tr>
									<th>Date</th>
									<th>Quantity</th>
									<th>Price</th>
								</tr>
							</thead>
							<tbody>
								{
									dairyInvoice.individualProducts.map((product, index)=>{
										return <tr key={index} style={{textDecoration: product.isCancelled?"line-through":"none"}} >
											<td>{product.date}</td>
											<td style={{textAlign: "right"}}>{product.quantity}</td>
											<td style={{textAlign: "right"}}>{product.price}</td>
										</tr>
									})
								}
								<tr>
									<td><b>Total</b></td>
									<td style={{textAlign: "right"}}><b>{ dairyInvoice.totalMilk }</b> Ltr</td>
									<td style={{textAlign: "right"}}><b>{ dairyInvoice.totalPrice }</b></td>
								</tr>
								{
									dairyInvoice.balanceAmount ?
									<>
										<tr>
											<td colspan="2">{ dairyInvoice.isAdvance ? "Previous Advance" : "Previous Balance"}</td>
											<td style={{textAlign: "right"}}>{ dairyInvoice.isAdvance ? "-" : "+"} { dairyInvoice.balanceAmount }</td>
										</tr>
										<tr>
											<td colspan="2"><b>Total Payable (Rs.)</b></td>
											<td style={{textAlign: "right"}}><b>{ dairyInvoice.totalPayable }</b></td>
										</tr>
									</>
									: <></>

								}
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