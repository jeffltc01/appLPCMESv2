using System;
using System.Collections.Generic;

namespace LPCylinderMES.Api.Models;

public partial class Contact
{
    public int Id { get; set; }

    public string FirstName { get; set; } = null!;

    public string? LastName { get; set; }

    public string? Notes { get; set; }

    public string? Email { get; set; }

    public string? OfficePhone { get; set; }

    public string? MobilePhone { get; set; }

    public int CustomerId { get; set; }

    public virtual ICollection<Address> Addresses { get; set; } = new List<Address>();

    public virtual Customer Customer { get; set; } = null!;
}
