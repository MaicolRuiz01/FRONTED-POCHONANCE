import { OnInit } from '@angular/core';
import { Component } from '@angular/core';
import { LayoutService } from './service/app.layout.service';

@Component({
    selector: 'app-menu',
    templateUrl: './app.menu.component.html'
})
export class AppMenuComponent implements OnInit {

    model: any[] = [];

    constructor(public layoutService: LayoutService) { }

    ngOnInit() {
        this.model = [
            {
                label: 'Home',
                items: [
                    { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/'] }
                ]
            },
            {
                label: 'SECCIONES DE LA APLICACION',
                items: [
                    {
                        label: 'CUENTAS', icon: 'pi pi-fw pi-users',
                        items: [
                            {
                                label: 'SALDOS', icon: 'pi pi-fw pi-wallet',
                                routerLink: ['/cuentas/saldos']
                            },
                            {
                                label: 'TRASPASOS', icon: 'pi pi-fw pi-arrow-right-arrow-left',
                                routerLink: ['/cuentas/traspasos']
                            },
                            {
                              label: 'COMPRAS', icon: 'pi pi-fw pi-tag',
                              routerLink: ['/cuentas/compras']
                           },
                           {
                            label: 'P2P9', icon: 'pi pi-fw pi-dollar',
                            routerLink: ['/cuentas/p2p']
                           },
                           {
                            label: 'VENTAS GENERALES', icon: 'pi pi-fw pi-tags',
                            routerLink: ['/cuentas/ventasgenerales']
                           },
                           {
                            label: 'IMPUESTOS', icon: 'pi pi-fw pi-calculator',
                            routerLink: ['/cuentas/impuestos']
                           },
                           {
                            label: 'TRX', icon: 'pi pi-fw pi-prime',
                            routerLink: ['/cuentas/trx']
                           },
                           {
                            label: 'Asignaciones', icon: 'pi pi-fw pi-cloud',
                            routerLink: ['/cuentas/asignacion']
                           },

                        ]
                    },
                    {
                      label: 'ASIGNAR', icon: 'pi pi-fw pi-address-book',
                      routerLink: ['/asignaciones']
                  },
                    {
                        label: 'BALANCE', icon: 'pi pi-fw pi-chart-line',
                                routerLink: ['/balance/caja']
                    },
                    {
                        label: 'GASTOS', icon: 'pi pi-fw pi-briefcase',
                        routerLink: ['/gastos']
                    },
                    {
                        label: 'CRIPTOS', icon: 'pi pi-fw pi-bitcoin',

                                routerLink: ['/cripto']

                    }

                ]
            },
            
        ];
    }
}
