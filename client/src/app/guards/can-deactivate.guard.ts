import { CanDeactivateFn } from '@angular/router';
import { CanComponentDeactivate } from '@app/interfaces/can-component-deactivate';
import { Observable, map } from 'rxjs';

export const canDeactivateGuard: CanDeactivateFn<CanComponentDeactivate> = (component: CanComponentDeactivate) => {
    if (!component.canDeactivate) {
        return true;
    }
    const res = component.canDeactivate();
    if (!(res instanceof Observable)) {
        return res;
    }
    return res.pipe(
        map((result) => {
            // If the modal is closed by clicking outside, it returns undefined, we want it to be false
            return !!result;
        }),
    );
};
