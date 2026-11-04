import moment from 'moment';
import React from 'react';
import { Button, Col, Form, Row, Table } from 'react-bootstrap';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
				rate: 50,
				billNo: Math.round(Math.random()*1000),
				billDate: moment().format("DD/MM/YY"),
				year: new Date().getFullYear(),
				individualProducts:[],
				totalMilk: 0,
				totalPrice: 0,
				cancelledMilk: 0,
				cancelledPrice: 0,
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
				date: moment(date).format("DD/MM/YY"),
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
		let cancelledMilk = 0
		let cancelledPrice = 0

		dairyInvoice.individualProducts.forEach((object, index)=>{
			const price = parseFloat(parseFloat(parseFloat(dairyInvoice.rate) * object.quantity).toFixed(2))
			dairyInvoice.individualProducts[index]["price"] = price
			totalPrice = totalPrice + price
			totalMilk = totalMilk + object.quantity
			if(object.isCancelled){
				cancelledMilk = cancelledMilk + object.quantity
				cancelledPrice = cancelledPrice + price
			}
		})
		totalPrice = Math.round(parseFloat(totalPrice))
		const netPrice = parseFloat((totalPrice - cancelledPrice).toFixed(2))
		dairyInvoice['totalPrice'] = totalPrice
		dairyInvoice['totalMilk'] = parseFloat(totalMilk.toFixed(2))
		dairyInvoice['cancelledMilk'] = parseFloat(cancelledMilk.toFixed(2))
		dairyInvoice['cancelledPrice'] = parseFloat(cancelledPrice.toFixed(2))

		if(dairyInvoice.isAdvance){
			dairyInvoice['totalPayable'] = parseFloat((netPrice - dairyInvoice.balanceAmount).toFixed(2))
		}
		else{
			dairyInvoice['totalPayable'] = parseFloat((netPrice + dairyInvoice.balanceAmount).toFixed(2))
		}

		this.setState({
			dairyInvoice: dairyInvoice
		})
	}

	downloadInvoice = async () => {
		const { dairyInvoice } = this.state
		const invoiceElement = document.getElementById('invoice-print-content')
		const actionBar = document.getElementById('hide-btn')
		const months = moment.months()

		if (!invoiceElement) {
			return
		}

		const isMobileView = window.innerWidth <= 768
		const previousWidth = invoiceElement.style.width
		const previousMaxWidth = invoiceElement.style.maxWidth
		const previousMargin = invoiceElement.style.margin
		const previousBoxSizing = invoiceElement.style.boxSizing
		const previousBackground = invoiceElement.style.background
		const previousBodyBackground = document.body.style.background
		const previousTransform = invoiceElement.style.transform
		const previousTransformOrigin = invoiceElement.style.transformOrigin

		if (actionBar) {
			actionBar.style.visibility = 'hidden'
		}

		const exportClone = invoiceElement.cloneNode(true)
		exportClone.id = 'invoice-export-clone'
		exportClone.style.width = '100%'
		exportClone.style.maxWidth = '100%'
		exportClone.style.margin = '0 auto'
		exportClone.style.boxSizing = 'border-box'
		exportClone.style.background = '#fff'
		exportClone.style.position = 'fixed'
		exportClone.style.left = '50%'
		exportClone.style.top = '0'
		exportClone.style.transform = 'translateX(-50%)'
		exportClone.style.visibility = 'visible'
		exportClone.style.opacity = '1'
		exportClone.style.pointerEvents = 'none'
		exportClone.style.zIndex = '99999'

		const rows = dairyInvoice.individualProducts || []
		const firstHalf = rows.slice(0, 16)
		const secondHalf = rows.slice(16)
		const renderPdfRows = (list) => {
			const filledRows = list.map((product) => (
				`<tr style="border:1px solid #333; text-align:center; font-size:9px; line-height:1; height:17px;">` +
					`<td style="padding:1px 2px; border:1px solid #333; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-decoration:${product.isCancelled ? 'line-through' : 'none'};">${product.date}</td>` +
					`<td style="padding:1px 2px; border:1px solid #333; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-decoration:${product.isCancelled ? 'line-through' : 'none'};">${product.quantity}</td>` +
					`<td style="padding:1px 2px; border:1px solid #333; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-decoration:${product.isCancelled ? 'line-through' : 'none'};">${product.price}</td>` +
				`</tr>`
			)).join('')

			const blankRows = Array.from({ length: Math.max(0, 16 - list.length) }, () => (
				`<tr style="border:1px solid #333; text-align:center; font-size:9px; line-height:1; height:17px;">` +
					`<td style="padding:1px 2px; border:1px solid #333; background:#fff;">&nbsp;</td>` +
					`<td style="padding:1px 2px; border:1px solid #333; background:#fff;">&nbsp;</td>` +
					`<td style="padding:1px 2px; border:1px solid #333; background:#fff;">&nbsp;</td>` +
				`</tr>`
			)).join('')

			return filledRows + blankRows
		}

		exportClone.innerHTML = `
			<div style="padding:10px; background:#fff; border:2px solid #000; width:100%; box-sizing:border-box; font-family:Arial, sans-serif;">
				<div style="text-align:center; border-bottom:2px solid #000; padding-bottom:6px; margin-bottom:8px;">
					<div style="font-size:21px; font-weight:700; letter-spacing:0.5px;">SHRI DATTA DAIRY FARM</div>
					<div style="font-size:12px;">Datta Shinde | 7385063457</div>
				</div>
				<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
					<div style="font-size:14px; font-weight:600;">Name: ${dairyInvoice.name}</div>
					<img src="${BuffaloImage}" alt="Buffalo" style="width:38px; height:38px; border:1px solid #000; border-radius:50%; object-fit:contain; background:#fff;" />
				</div>
				<div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:8px;">
					<div style="font-size:14px; font-weight:600;">Month: ${months[dairyInvoice.month]}-${String(dairyInvoice.year).slice(-2)}</div>
					<div style="font-size:14px; font-weight:600;">Rate/Ltr: ${dairyInvoice.rate}/-</div>
				</div>
				<div style="display:flex; gap:8px; width:100%; box-sizing:border-box;">
					<table style="width:48%; border-collapse:collapse; border:1px solid #333; table-layout:fixed; font-size:11px; flex:1;">
						<thead>
							<tr>
								<th style="border:1px solid #333; padding:4px; text-align:center; font-weight:700;">Date</th>
								<th style="border:1px solid #333; padding:4px; text-align:center; font-weight:700;">Qty</th>
								<th style="border:1px solid #333; padding:4px; text-align:center; font-weight:700;">Price</th>
							</tr>
						</thead>
						<tbody>${renderPdfRows(firstHalf)}</tbody>
					</table>
					<table style="width:48%; border-collapse:collapse; border:1px solid #333; table-layout:fixed; font-size:12px; flex:1;">
						<thead>
							<tr>
								<th style="border:1px solid #333; padding:4px; text-align:center; font-weight:700;">Date</th>
								<th style="border:1px solid #333; padding:4px; text-align:center; font-weight:700;">Qty</th>
								<th style="border:1px solid #333; padding:4px; text-align:center; font-weight:700;">Price</th>
							</tr>
						</thead>
						<tbody>
							${renderPdfRows(secondHalf)}
						</tbody>
					</table>
				</div>
				<div style="margin-top:12px; width:100%; box-sizing:border-box;">
					<table style="width:100%; border-collapse:collapse; border:1px solid #333; table-layout:fixed; font-size:12px;">
						<tbody>
							<tr>
								<td style="border:1px solid #333; padding:5px 6px; font-weight:700; width:50%;">Total</td>
								<td style="border:1px solid #333; padding:5px 6px; width:20%; text-align:left; font-weight:700;">${dairyInvoice.totalMilk} Ltr</td>
								<td style="border:1px solid #333; padding:5px 6px; width:30%; text-align:right; font-weight:700;">${dairyInvoice.totalPrice}</td>
							</tr>
							${dairyInvoice.cancelledPrice ? `
								<tr>
									<td style="border:1px solid #333; padding:5px 6px;">Cancelled</td>
									<td style="border:1px solid #333; padding:5px 6px; text-align:left;">${dairyInvoice.cancelledMilk} Ltr</td>
									<td style="border:1px solid #333; padding:5px 6px; text-align:right;">${-dairyInvoice.cancelledPrice}</td>
								</tr>
							` : ''}
							<tr>
								<td style="border:1px solid #333; padding:5px 6px;">${dairyInvoice.isAdvance ? 'Previous Advance' : 'Previous Balance'}</td>
								<td style="border:1px solid #333; padding:5px 6px; text-align:right;">&nbsp;</td>
								<td style="border:1px solid #333; padding:5px 6px; text-align:right;">${dairyInvoice.isAdvance ? '-' : '+'} ${dairyInvoice.balanceAmount || 0}</td>
							</tr>
							<tr>
								<td style="border:1px solid #333; padding:5px 6px; font-weight:700;">Total Payable (Rs.)</td>
								<td style="border:1px solid #333; padding:5px 6px; text-align:left; font-weight:700;">&nbsp;</td>
								<td style="border:1px solid #333; padding:5px 6px; text-align:right; font-weight:700;">${dairyInvoice.totalPayable}</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		`

		document.body.appendChild(exportClone)
		invoiceElement.style.width = '100%'
		invoiceElement.style.maxWidth = '100%'
		invoiceElement.style.margin = '0 auto'
		invoiceElement.style.boxSizing = 'border-box'
		invoiceElement.style.background = '#fff'
		document.body.style.background = '#fff'
		invoiceElement.style.transform = 'scale(1)'
		invoiceElement.style.transformOrigin = 'top left'
		window.scrollTo({ top: 0, behavior: 'auto' })

		try {
			const canvas = await html2canvas(exportClone, {
				scale: isMobileView ? 2.1 : 2,
				backgroundColor: '#ffffff',
				useCORS: true,
				scrollX: 0,
				scrollY: 0,
				width: exportClone.scrollWidth,
				height: exportClone.scrollHeight
			})

			const imgData = canvas.toDataURL('image/png')
			const pdf = new jsPDF({
				orientation: 'portrait',
				unit: 'mm',
				format: 'a4'
			})
			const pageWidth = pdf.internal.pageSize.getWidth()
			const pageHeight = pdf.internal.pageSize.getHeight()
			const margin = isMobileView ? 10 : 12
			const printableWidth = pageWidth - (margin * 2)
			const imgProps = pdf.getImageProperties(imgData)
			const ratio = imgProps.width / imgProps.height
			const maxExportWidth = isMobileView ? 180 : printableWidth
			let imgWidth = Math.min(printableWidth, imgProps.width, maxExportWidth)
			let imgHeight = imgWidth / ratio

			if (imgHeight > pageHeight - (margin * 2)) {
				imgHeight = pageHeight - (margin * 2)
				imgWidth = imgHeight * ratio
				if (imgWidth > maxExportWidth) {
					imgWidth = maxExportWidth
					imgHeight = imgWidth / ratio
				}
			}

			const centeredX = (pageWidth - imgWidth) / 2
			pdf.addImage(imgData, 'PNG', centeredX, margin, imgWidth, imgHeight, undefined, 'FAST')
			pdf.save(`${dairyInvoice.name || 'Customer'}-${this.getMonthShort()}-${String(dairyInvoice.year).slice(-2)}.pdf`)
		} catch (error) {
			console.error('Invoice PDF download failed:', error)
			alert('Unable to download invoice as PDF right now.')
		} finally {
			if (exportClone && exportClone.parentNode) {
				exportClone.parentNode.removeChild(exportClone)
			}
			invoiceElement.style.width = previousWidth
			invoiceElement.style.maxWidth = previousMaxWidth
			invoiceElement.style.margin = previousMargin
			invoiceElement.style.boxSizing = previousBoxSizing
			invoiceElement.style.background = previousBackground
			invoiceElement.style.transform = previousTransform
			invoiceElement.style.transformOrigin = previousTransformOrigin
			document.body.style.background = previousBodyBackground

			if (actionBar) {
				actionBar.style.visibility = 'visible'
			}
		}
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
											<td style={{ textDecoration: product.isCancelled?"line-through":"none" }}>{product.price}</td>
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
									<td></td>
								</tr>
								{
									dairyInvoice.cancelledPrice ?
									<tr>
										<td>Cancelled</td>
										<td style={{textAlign: "right"}}><b>{ dairyInvoice.cancelledMilk }</b> Ltr</td>
										<td style={{textAlign: "right"}}><b>{ -dairyInvoice.cancelledPrice }</b></td>
										<td></td>
									</tr>
									: <></>
								}
								{
									dairyInvoice.balanceAmount ?
									<>
										<tr>
											<td colspan="2">{ dairyInvoice.isAdvance ? "Previous Advance" : "Previous Balance"}</td>
											<td style={{textAlign: "right"}}>{ dairyInvoice.isAdvance ? "-" : "+"} { dairyInvoice.balanceAmount }</td>
											<td></td>
										</tr>
										<tr>
											<td colspan="2"><b>Total Payable</b></td>
											<td style={{textAlign: "right"}}><b>{ dairyInvoice.totalPayable }</b></td>
											<td></td>
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
				<div id='invoice-print-content' className='dairy-invoice'>
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
											<Form.Label>Month: <b>{months[dairyInvoice.month] +'-'+String(dairyInvoice.year).slice(-2)}</b></Form.Label><br/>
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
						<Table bordered size="sm" style={{textAlign: "center"}}>
							<thead>
								<tr>
									<th>Date</th>
									<th >Quantity</th>
									<th>Price</th>
								</tr>
							</thead>
							<tbody>
								{
									dairyInvoice.individualProducts.map((product, index)=>{
										return <tr key={index} style={{textDecoration: product.isCancelled?"line-through":"none", fontWeight: product.isCancelled?"bold": "normal" }} >
											<td>{product.date}</td>
											<td >{product.quantity}</td>
											<td >{product.price}</td>
										</tr>
									})
								}
								<tr style={{border: "0px solid #fff"}}>
									<td colspan="3"></td>
								</tr>
								<tr style={{border: "0px solid #fff"}}>
									<td colspan="3"></td>
								</tr>
								<tr>
									<td style={{textAlign: "left"}}><b>Total</b></td>
									<td ><b>{ dairyInvoice.totalMilk }</b> Ltr</td>
									<td style={{textAlign: "right"}}><b>{ dairyInvoice.totalPrice }</b></td>
								</tr>
								{
									dairyInvoice.cancelledPrice ?
									<tr>
										<td style={{textAlign: "left"}}>Cancelled</td>
										<td ><b>{ dairyInvoice.cancelledMilk }</b> Ltr</td>
										<td style={{textAlign: "right"}}><b>{ -dairyInvoice.cancelledPrice }</b></td>
									</tr>
									: <></>
								}
								{
									dairyInvoice.balanceAmount ?
									<>
										<tr>
											<td colspan="2" style={{textAlign: "left"}}>{ dairyInvoice.isAdvance ? "Previous Advance" : "Previous Balance"}</td>
											<td style={{textAlign: "right"}}>{ dairyInvoice.isAdvance ? "-" : "+"} { dairyInvoice.balanceAmount }</td>
										</tr>
										<tr>
											<td colspan="2" style={{textAlign: "left"}}><b>Total Payable (Rs.)</b></td>
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