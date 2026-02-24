using Microsoft.AspNetCore.Mvc;

namespace LPCylinderMES.Api.Services;

public static class ControllerServiceExceptionExtensions
{
    public static ActionResult ToActionResult(this ControllerBase controller, ServiceException ex)
    {
        if (ex.StatusCode == StatusCodes.Status404NotFound)
            return controller.NotFound(new { message = ex.PublicMessage });
        if (ex.StatusCode == StatusCodes.Status409Conflict)
            return controller.Conflict(new { message = ex.PublicMessage });

        return controller.BadRequest(new { message = ex.PublicMessage });
    }
}

