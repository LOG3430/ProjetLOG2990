import { CanComponentDeactivate } from '@app/interfaces/can-component-deactivate';
import { Observable, of } from 'rxjs';
import { canDeactivateGuard } from './can-deactivate.guard';
/* eslint-disable @typescript-eslint/no-explicit-any*/
describe('CanDeactivateGuard', () => {
    it('should call canDeactivate method on component if it is defined', () => {
        const component: CanComponentDeactivate = jasmine.createSpyObj('CanComponentDeactivate', ['canDeactivate']);
        canDeactivateGuard(component, {} as any, {} as any, {} as any);
        expect(component.canDeactivate).toHaveBeenCalled();
    });

    it('should return true if canDeactivate method is not defined', () => {
        const component: CanComponentDeactivate = {} as any;
        const res = canDeactivateGuard(component, {} as any, {} as any, {} as any);
        expect(res).toBeTrue();
    });

    it('should return observable of false if canDeactivate returns observable of undefined', () => {
        const component: jasmine.SpyObj<CanComponentDeactivate> = jasmine.createSpyObj('CanComponentDeactivate', ['canDeactivate']);
        component.canDeactivate.and.returnValue(of(undefined));
        const res = canDeactivateGuard(component, {} as any, {} as any, {} as any);
        (res as Observable<boolean>).subscribe((result) => {
            expect(result).toBeFalse();
        });
    });
});
