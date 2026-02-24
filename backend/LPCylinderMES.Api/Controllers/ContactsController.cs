using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Controllers;

[ApiController]
[Route("api/customers/{customerId:int}/contacts")]
public class ContactsController(LpcAppsDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<ContactDto>>> GetAll(int customerId)
    {
        if (!await db.Customers.AnyAsync(c => c.Id == customerId))
            return NotFound();

        var contacts = await db.Contacts
            .Where(c => c.CustomerId == customerId)
            .OrderBy(c => c.LastName).ThenBy(c => c.FirstName)
            .Select(c => new ContactDto(
                c.Id, c.FirstName, c.LastName, c.Email,
                c.OfficePhone, c.MobilePhone, c.Notes, c.CustomerId))
            .ToListAsync();

        return Ok(contacts);
    }

    [HttpPost]
    public async Task<ActionResult<ContactDto>> Create(int customerId, ContactCreateDto dto)
    {
        if (!await db.Customers.AnyAsync(c => c.Id == customerId))
            return NotFound();

        var contact = new Contact
        {
            CustomerId = customerId,
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Email = dto.Email,
            OfficePhone = dto.OfficePhone,
            MobilePhone = dto.MobilePhone,
            Notes = dto.Notes,
        };

        db.Contacts.Add(contact);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), new { customerId },
            new ContactDto(contact.Id, contact.FirstName, contact.LastName,
                contact.Email, contact.OfficePhone, contact.MobilePhone,
                contact.Notes, contact.CustomerId));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ContactDto>> Update(int customerId, int id, ContactUpdateDto dto)
    {
        var contact = await db.Contacts
            .FirstOrDefaultAsync(c => c.Id == id && c.CustomerId == customerId);

        if (contact is null)
            return NotFound();

        contact.FirstName = dto.FirstName;
        contact.LastName = dto.LastName;
        contact.Email = dto.Email;
        contact.OfficePhone = dto.OfficePhone;
        contact.MobilePhone = dto.MobilePhone;
        contact.Notes = dto.Notes;

        await db.SaveChangesAsync();

        return Ok(new ContactDto(contact.Id, contact.FirstName, contact.LastName,
            contact.Email, contact.OfficePhone, contact.MobilePhone,
            contact.Notes, contact.CustomerId));
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int customerId, int id)
    {
        var contact = await db.Contacts
            .FirstOrDefaultAsync(c => c.Id == id && c.CustomerId == customerId);

        if (contact is null)
            return NotFound();

        var isDefaultOrderContact = await db.Customers.AnyAsync(c =>
            c.Id == customerId &&
            c.DefaultOrderContactId == id);
        if (isDefaultOrderContact)
        {
            return BadRequest(new
            {
                message = "This contact is selected as the customer's default order contact. Clear or change the default before deleting."
            });
        }

        db.Contacts.Remove(contact);
        await db.SaveChangesAsync();

        return NoContent();
    }
}
