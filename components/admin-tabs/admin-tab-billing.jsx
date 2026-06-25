"use client"
import { fetchWithAuth } from "@/lib/api"

import { useState, useEffect, useRef } from "react"


export default function AdminTabBilling() {
  const [invoices, setInvoices] = useState([])
  const [clients, setClients] = useState([])
  const [pets, setPets] = useState([])
  const [products, setProducts] = useState([])
  const [services, setServices] = useState([])
  
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [viewInvoice, setViewInvoice] = useState(null)
  
  // Create Invoice State
  const [selectedClient, setSelectedClient] = useState("")
  const [clientSearch, setClientSearch] = useState("")
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false)
  const clientDropdownRef = useRef(null)
  const [selectedPet, setSelectedPet] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState([
    { item_type: "Service", product_id: "", description: "", quantity: 1, unit_price: 0, subtotal: 0 }
  ])

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    function handleClickOutside(event) {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(event.target)) {
        setIsClientDropdownOpen(false)
        if (selectedClient) {
          const activeClient = clients.find(c => String(c.id) === String(selectedClient))
          if (activeClient) {
            setClientSearch(`${activeClient.full_name} (${activeClient.email})`)
            setClientPhone(activeClient.phone_number || "")
          }
        } else {
          setClientSearch("")
          setClientPhone("")
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [selectedClient, clients])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [invRes, cliRes, petRes, prodRes, servRes] = await Promise.all([
        fetchWithAuth("/api/admin/billing"),
        fetchWithAuth("/api/admin/clients"),
        fetchWithAuth("/api/admin/patients"),
        fetchWithAuth("/api/products"),
        fetchWithAuth("/api/services")
      ])
      
      if (invRes.ok) setInvoices(await invRes.json())
      if (cliRes.ok) setClients(await cliRes.json())
      if (petRes.ok) setPets(await petRes.json())
      if (prodRes.ok) {
        const prodData = await prodRes.json()
        setProducts(prodData.products || prodData) // Depends on how api/products returns
      }
      if (servRes.ok) {
        setServices(await servRes.json())
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Derived state
  const clientPets = pets.filter(p => p.user_id === parseInt(selectedClient))
  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0)

  const filteredClients = clients.filter(c => {
    const query = clientSearch.toLowerCase()
    return (
      (c.full_name && c.full_name.toLowerCase().includes(query)) ||
      (c.email && c.email.toLowerCase().includes(query)) ||
      (c.phone_number && c.phone_number.toLowerCase().includes(query))
    )
  })

  // Handlers for Items
  const addItem = () => {
    setItems([...items, { item_type: "Service", product_id: "", description: "", quantity: 1, unit_price: 0, subtotal: 0 }])
  }

  const removeItem = (index) => {
    if (items.length === 1) return;
    const newItems = [...items]
    newItems.splice(index, 1)
    setItems(newItems)
  }

  const handleItemChange = (index, field, value) => {
    const newItems = [...items]
    const item = newItems[index]
    
    if (field === 'item_type') {
      item.item_type = value
      item.product_id = ""
      item.description = ""
      item.unit_price = 0
    } else if (field === 'product_id') {
      item.product_id = value
      const product = products.find(p => p.id === parseInt(value))
      if (product) {
        item.description = product.name
        item.unit_price = product.price
      } else {
        item.description = ""
        item.unit_price = 0
      }
    } else if (field === 'service_select') {
      const selectedService = services.find(s => s.name === value)
      if (selectedService) {
        item.description = selectedService.name
        const parsedPrice = parseFloat(selectedService.price)
        item.unit_price = isNaN(parsedPrice) ? 0 : parsedPrice
      } else {
        item.description = ""
        item.unit_price = 0
      }
    } else {
      item[field] = value
    }
    
    // Recalculate subtotal if qty or price changes
    if (['quantity', 'unit_price', 'product_id', 'service_select', 'description'].includes(field)) {
      item.subtotal = Number(item.quantity) * Number(item.unit_price)
    }
    
    setItems(newItems)
  }

  const openAddModal = () => {
    setSelectedClient("")
    setClientSearch("")
    setClientPhone("")
    setIsClientDropdownOpen(false)
    setSelectedPet("")
    setDueDate(new Date().toISOString().split('T')[0]) // Today
    setNotes("")
    setItems([{ item_type: "Service", product_id: "", description: "", quantity: 1, unit_price: 0, subtotal: 0 }])
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setViewInvoice(null)
  }

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    
    const payload = {
      client_id: selectedClient,
      phone_number: clientPhone,
      pet_id: selectedPet || null,
      total_amount: totalAmount,
      status: "Pending",
      due_date: dueDate ? dueDate + " 23:59:59" : null,
      notes,
      items
    }

    try {
      const res = await fetchWithAuth("/api/admin/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      
      if (res.ok) {
        fetchData()
        closeModal()
      } else {
        const errorData = await res.json()
        alert(errorData.error || "Failed to create invoice")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Failed to create invoice")
    }
  }

  const updateStatus = async (id, status) => {
    try {
      const res = await fetchWithAuth(`/api/admin/billing/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        fetchData()
        if (viewInvoice && viewInvoice.id === id) {
          setViewInvoice({ ...viewInvoice, status })
        }
      }
    } catch (error) {
      console.error("Error updating status:", error)
    }
  }

  const fetchInvoiceDetails = async (id) => {
    try {
      const res = await fetchWithAuth(`/api/admin/billing/${id}`)
      if (res.ok) {
        const data = await res.json()
        setViewInvoice(data)
      }
    } catch (error) {
      console.error("Error fetching details:", error)
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading billing data...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Billing & Invoices</h2>
        <button
          onClick={openAddModal}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Create New Invoice
        </button>
      </div>

      <div className="bg-background border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Invoice ID & Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Client & Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-muted/30">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-bold text-foreground">INV-{String(inv.id).padStart(4, '0')}</div>
                    <div className="text-xs text-muted-foreground">{new Date(inv.issue_date).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium">{inv.client_name}</div>
                    <div className="text-xs text-muted-foreground">Pet: {inv.pet_name || "N/A"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold">NPR {Number(inv.total_amount).toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      inv.status === 'Paid' ? 'bg-green-100 text-green-800' :
                      inv.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => fetchInvoiceDetails(inv.id)}
                      className="text-primary hover:text-primary/80 mr-4"
                    >
                      View
                    </button>
                    {inv.status === 'Pending' && (
                      <button
                        onClick={() => updateStatus(inv.id, 'Paid')}
                        className="text-green-600 hover:text-green-800"
                      >
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-muted-foreground">
                    No invoices generated yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Invoice Modal */}
      {viewInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-3xl overflow-hidden my-8">
            <div className="flex justify-between items-center p-6 border-b border-border">
              <h3 className="text-lg font-bold">Invoice #INV-{String(viewInvoice.id).padStart(4, '0')}</h3>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground">
                &times;
              </button>
            </div>
            <div className="p-6">
              <div className="flex justify-between mb-8">
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase">Billed To</h4>
                  <div className="font-bold text-lg mt-1">{viewInvoice.client_name}</div>
                  <div className="text-sm text-muted-foreground">{viewInvoice.client_email}</div>
                  {viewInvoice.phone_number && <div className="text-sm text-muted-foreground">{viewInvoice.phone_number}</div>}
                  <div className="text-sm mt-2"><span className="font-semibold">Patient:</span> {viewInvoice.pet_name || 'N/A'}</div>
                </div>
                <div className="text-right">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase">Invoice Details</h4>
                  <div className="text-sm mt-1"><span className="font-semibold">Issued:</span> {new Date(viewInvoice.issue_date).toLocaleDateString()}</div>
                  <div className="text-sm mt-1"><span className="font-semibold">Due:</span> {viewInvoice.due_date ? new Date(viewInvoice.due_date).toLocaleDateString() : 'Upon receipt'}</div>
                  <div className="mt-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      viewInvoice.status === 'Paid' ? 'bg-green-100 text-green-800' :
                      viewInvoice.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {viewInvoice.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto mb-8">
                <table className="w-full border border-border rounded-lg overflow-hidden">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-bold text-muted-foreground">Type</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-muted-foreground">Description</th>
                      <th className="px-4 py-2 text-right text-xs font-bold text-muted-foreground">Qty</th>
                      <th className="px-4 py-2 text-right text-xs font-bold text-muted-foreground">Price</th>
                      <th className="px-4 py-2 text-right text-xs font-bold text-muted-foreground">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {viewInvoice.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 text-sm">{item.item_type}</td>
                        <td className="px-4 py-2 text-sm font-medium">{item.description}</td>
                        <td className="px-4 py-2 text-sm text-right">{item.quantity}</td>
                        <td className="px-4 py-2 text-sm text-right">NPR {Number(item.unit_price).toFixed(2)}</td>
                        <td className="px-4 py-2 text-sm text-right font-bold">NPR {Number(item.subtotal).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tbody className="bg-muted/50 border-t-2 border-border">
                    <tr>
                      <td colSpan="4" className="px-4 py-3 text-right font-bold text-lg">Total Amount:</td>
                      <td className="px-4 py-3 text-right font-bold text-lg text-primary">NPR {Number(viewInvoice.total_amount).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              {viewInvoice.notes && (
                <div className="mb-4">
                  <h4 className="text-sm font-bold mb-1">Notes:</h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded">{viewInvoice.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-4xl overflow-hidden my-8">
            <div className="flex justify-between items-center p-6 border-b border-border">
              <h3 className="text-lg font-bold">Create New Invoice</h3>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground">
                &times;
              </button>
            </div>
            
            <div className="max-h-[75vh] overflow-y-auto p-6">
              <form id="invoice-form" onSubmit={handleCreateSubmit}>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 bg-muted/30 p-4 rounded-lg border border-border">
                  <div className="relative" ref={clientDropdownRef}>
                    <label className="block text-sm font-bold mb-1 text-primary">Select Client *</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Type name, email, or phone to search..."
                        value={clientSearch}
                        onChange={(e) => {
                          setClientSearch(e.target.value)
                          setIsClientDropdownOpen(true)
                          if (selectedClient) {
                            setSelectedClient("")
                            setClientPhone("")
                            setSelectedPet("")
                          }
                        }}
                        onFocus={() => setIsClientDropdownOpen(true)}
                        className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary bg-background text-foreground"
                        required={!selectedClient}
                      />
                      {selectedClient && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedClient("")
                            setClientSearch("")
                            setClientPhone("")
                            setSelectedPet("")
                            setIsClientDropdownOpen(false)
                          }}
                          className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground text-xs bg-muted hover:bg-muted/80 rounded px-1.5 py-0.5"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {isClientDropdownOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {filteredClients.length > 0 ? (
                          filteredClients.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setSelectedClient(String(c.id))
                                setClientSearch(`${c.full_name} (${c.email})`)
                                setClientPhone(c.phone_number || "")
                                setSelectedPet("")
                                setIsClientDropdownOpen(false)
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-muted/80 transition-colors text-sm border-b border-border last:border-0"
                            >
                              <div className="font-semibold text-foreground">{c.full_name}</div>
                              <div className="text-xs text-muted-foreground flex justify-between">
                                <span>{c.email}</span>
                                {c.phone_number && <span>{c.phone_number}</span>}
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-3 text-sm text-muted-foreground text-center">
                            No clients found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="Phone number"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-border rounded-md focus:ring-1 focus:ring-primary bg-background text-foreground"
                      disabled={!selectedClient}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">Select Patient</label>
                    <select
                      value={selectedPet}
                      onChange={(e) => setSelectedPet(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-border rounded-md focus:ring-1 focus:ring-primary"
                      disabled={!selectedClient}
                    >
                      <option value="">-- Optional --</option>
                      {clientPets.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.species})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">Due Date</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-border rounded-md focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-lg">Line Items</h4>
                    <button
                      type="button"
                      onClick={addItem}
                      className="text-sm bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1 rounded font-semibold transition-colors"
                    >
                      + Add Another Item
                    </button>
                  </div>
                  
                  {items.map((item, index) => (
                    <div key={index} className="flex flex-wrap items-end gap-3 mb-3 p-3 border border-border rounded-md relative group">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove item"
                      >
                        &times;
                      </button>
                      
                      <div className="w-full md:w-auto flex-1">
                        <label className="block text-xs font-bold mb-1">Type</label>
                        <select
                          value={item.item_type}
                          onChange={(e) => handleItemChange(index, 'item_type', e.target.value)}
                          className="w-full px-2 py-2 text-sm border border-border rounded"
                        >
                          <option value="Service">Service</option>
                          <option value="Product">Product</option>
                        </select>
                      </div>

                      {item.item_type === 'Product' ? (
                        <div className="w-full md:w-[35%]">
                          <label className="block text-xs font-bold mb-1 text-primary">Select Product (Will deduct stock)</label>
                          <select
                            value={item.product_id}
                            onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                            className="w-full px-2 py-2 text-sm border border-border rounded font-medium"
                            required
                          >
                            <option value="">-- Select Inventory Item --</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                                {p.name} (NPR {p.price}) - Stock: {p.stock}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="w-full md:w-[35%] space-y-1">
                          <label className="block text-xs font-bold mb-1">Select Service</label>
                          <select
                            value={services.some(s => s.name === item.description) ? item.description : (item.description ? "custom" : "")}
                            onChange={(e) => {
                              const val = e.target.value
                              if (val === 'custom') {
                                handleItemChange(index, 'description', '')
                              } else {
                                handleItemChange(index, 'service_select', val)
                              }
                            }}
                            className="w-full px-2 py-2 text-sm border border-border rounded font-medium bg-background text-foreground"
                            required
                          >
                            <option value="">-- Select Service --</option>
                            {services.map(s => (
                              <option key={s.id} value={s.name}>
                                {s.name} {s.price ? `(NPR ${s.price})` : ""}
                              </option>
                            ))}
                            <option value="custom">Custom Service...</option>
                          </select>
                          
                          {(item.description === '' || !services.some(s => s.name === item.description)) && (
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                              placeholder="Enter custom service description"
                              className="w-full px-2 py-2 text-sm border border-border rounded mt-1 bg-background text-foreground"
                              required
                            />
                          )}
                        </div>
                      )}

                      {item.item_type === 'Product' ? (
                        <div className="w-20">
                          <label className="block text-xs font-bold mb-1">Qty</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            className="w-full px-2 py-2 text-sm border border-border rounded text-center"
                            required
                          />
                        </div>
                      ) : (
                        <div className="w-20">
                          {/* Hidden Qty for Service, always 1 */}
                        </div>
                      )}

                      <div className="w-28">
                        <label className="block text-xs font-bold mb-1">
                          {item.item_type === 'Product' ? 'Unit Price (NPR)' : 'Price (NPR)'}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                          className="w-full px-2 py-2 text-sm border border-border rounded text-right"
                          disabled={item.item_type === 'Product'}
                          required
                        />
                      </div>

                      <div className="w-28">
                        <label className="block text-xs font-bold mb-1 text-muted-foreground">Subtotal</label>
                        <div className="px-2 py-2 text-sm font-bold bg-muted text-right rounded">
                          NPR {item.subtotal.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-end mt-4 text-xl">
                    <div className="bg-primary text-primary-foreground px-6 py-3 rounded-lg shadow-sm">
                      <span className="font-medium mr-4">Total Amount:</span>
                      <span className="font-bold">NPR {totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-1">Notes / Payment Terms (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows="2"
                    className="w-full px-3 py-2 text-sm border border-border rounded-md focus:ring-1 focus:ring-primary"
                  ></textarea>
                </div>
              </form>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t border-border bg-muted/10">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="invoice-form"
                className="px-6 py-2 bg-primary text-primary-foreground font-bold rounded-md hover:bg-primary/90 shadow-sm transition-colors"
                disabled={!selectedClient || totalAmount === 0}
              >
                Generate Invoice & Reduce Stock
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
