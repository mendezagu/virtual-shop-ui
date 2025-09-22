import { Routes } from '@angular/router';
import { SignUpComponent } from './components/auth/sign-up/sign-up.component';
import { SignInComponent } from './components/auth/sign-in/sign-in.component';
import { ForgotPasswordComponent } from './components/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './components/auth/reset-password/reset-password.component';
import { LandingHomeComponent } from './components/landing/landing-home/landing-home.component';
import { CreatestoreComponent } from './components/stores/createstore/createstore.component';
import { authGuard } from './guards/auth.guard';
import { MyStoreComponent } from './components/stores/store-basic-info/store-basic-info.component';
import { CreateProductComponent } from './components/products/create-product/create-product.component';
import { MyProductsComponent } from './components/products/my-products/my-products.component';
import { EditProductComponent } from './components/products/edit-product/edit-product.component';
import { PublicStoreComponent } from './user-components/public-store/public-store.component';
import { PublicProductComponent } from './user-components/public-product/public-product.component';
import { StepperComponent } from './shared/components/stepper/stepper.component';
import { ProductDetailComponent } from './user-components/product-detail/product-detail.component';
import { CheckoutDataComponent } from './components/checkout-process/checkout-data/checkout-data.component';
import { SuccessfulPaymentComponent } from './components/checkout-process/successful-payment/successful-payment.component';
import { FailedPaymentComponent } from './components/checkout-process/failed-payment/failed-payment.component';
import { PendingPaymentComponent } from './components/checkout-process/pending-payment/pending-payment.component';
import { CategoryProductsComponent } from './user-components/category-products/category-products.component';
import { MyCategoriesComponent } from './my-categories/my-categories.component';
import { OrdersAdminComponent } from './components/orders-admin/orders-admin.component';
import { StorePageComponent } from './components/stores/store-page/store-page.component';

export const routes: Routes = [
  // Rutas de autenticación
  { path: 'sign-up', component: SignUpComponent },
  { path: 'sign-in', component: SignInComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },

  // Panel administrativo
  { path: 'landing-home', component: LandingHomeComponent, canActivate: [authGuard] },
  { path: 'create-store', component: CreatestoreComponent, canActivate: [authGuard] },
  { path: 'my-store', component: StorePageComponent, canActivate: [authGuard] },
  { path: 'create-product', component: CreateProductComponent, canActivate: [authGuard] },
  { path: 'my-products', component: MyProductsComponent, canActivate: [authGuard] },
  { path: 'edit-product/:id', component: EditProductComponent, canActivate: [authGuard] },
  { path: 'stepper', component: StepperComponent, canActivate: [authGuard] },
  { path: 'mis-categorias', component: MyCategoriesComponent, canActivate: [authGuard] },
  { path: 'mis-pedidos', component: OrdersAdminComponent, canActivate: [authGuard]},

  // ================= RUTAS PÚBLICAS =================
  { path: 'store/:slug', component: PublicStoreComponent },
  { path: 'store/:slug/products', component: PublicProductComponent },
  { path: 'producto/:id', component: ProductDetailComponent },
  { path: 'store/:slug/categoria/:categorySlug', component: CategoryProductsComponent },
  { path: 'store/:slug/checkout-data', component: CheckoutDataComponent},

  //Payments
 { path: 'successful-payment', component: SuccessfulPaymentComponent },
  { path: 'failed-payment', component: FailedPaymentComponent },
  { path: 'pending-payment', component: PendingPaymentComponent },


  // Redirecciones por defecto
  { path: '', redirectTo: 'sign-in', pathMatch: 'full' },
  { path: '**', redirectTo: 'sign-in' }
];
