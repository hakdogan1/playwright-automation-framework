import { test as core } from '../../core/fixtures';
import { ButtonsPage } from './pages/buttons.page';
import { InputsPage } from './pages/inputs.page';
import { NativeSelectPage, SearchableSelectPage } from './pages/dropdowns.page';
import { ModalsPage } from './pages/modals.page';
import { CheckboxPage, MultiSelectPage, RadioPage } from './pages/selection.pages';
import { AccordionsPage, TabsPage } from './pages/navigation.pages';
import { DoubleClickPage, RightClickPage } from './pages/mouse.pages';
import { PaginationPage, StaticTablePage } from './pages/data.pages';
import { JavaScriptAlertsPage } from './pages/javascript-alerts.page';
import { BugPlaygroundPage } from './pages/bug-playground.page';
import { KeyboardKeysPage } from './pages/keyboard-keys.page';
import { SliderPage } from './pages/slider.page';
import { DragDropPage } from './pages/drag-drop.page';
import { FileDownloadPage } from './pages/file-download.page';
import { FileUploadPage } from './pages/file-upload.page';
import { FormRegisterPage } from './pages/form-register.page';
import { DynamicTablePage } from './pages/dynamic-table.page';
import { NotificationsPage } from './pages/notifications.page';
import { IframesPage } from './pages/iframes.page';
import { DateRangePage } from './pages/date-range.page';
import { AlertsPage, ToastsPage } from './pages/overlays.pages';
import { InfiniteScrollPage, LazyLoadPage, LoaderPage } from './pages/async.pages';
import { DatePickerPage } from './pages/date-picker.page';
import { NewTabPage, ShadowDomPage } from './pages/embed.pages';
import { BrokenImagesPage } from './pages/broken-images.page';
import { LabFormPage, MultiStepFormPage, ValidationErrorsPage } from './pages/form-lab.pages';
import { ADDRESS, CHECKOUT, CONTACT, LOGIN, PAYMENT, PROFILE } from './data/form-lab.data';
import { GenerateTextFilePage, OtpLoginPage, PdfDownloadPage } from './pages/otp-files.pages';

/** QA Practice fixtures: core guard/evidence/gates plus page objects (created lazily per test). */
interface QaPracticePages {
  buttonsPage: ButtonsPage;
  inputsPage: InputsPage;
  nativeSelectPage: NativeSelectPage;
  searchableSelectPage: SearchableSelectPage;
  modalsPage: ModalsPage;
  checkboxPage: CheckboxPage;
  radioPage: RadioPage;
  multiSelectPage: MultiSelectPage;
  tabsPage: TabsPage;
  accordionsPage: AccordionsPage;
  doubleClickPage: DoubleClickPage;
  rightClickPage: RightClickPage;
  staticTablePage: StaticTablePage;
  paginationPage: PaginationPage;
  javaScriptAlertsPage: JavaScriptAlertsPage;
  bugPlaygroundPage: BugPlaygroundPage;
  keyboardKeysPage: KeyboardKeysPage;
  sliderPage: SliderPage;
  dragDropPage: DragDropPage;
  formRegisterPage: FormRegisterPage;
  fileUploadPage: FileUploadPage;
  fileDownloadPage: FileDownloadPage;
  dynamicTablePage: DynamicTablePage;
  notificationsPage: NotificationsPage;
  iframesPage: IframesPage;
  dateRangePage: DateRangePage;
  alertsPage: AlertsPage;
  toastsPage: ToastsPage;
  loaderPage: LoaderPage;
  lazyLoadPage: LazyLoadPage;
  infiniteScrollPage: InfiniteScrollPage;
  tablesPage: DynamicTablePage;
  newTabPage: NewTabPage;
  shadowDomPage: ShadowDomPage;
  datePickerPage: DatePickerPage;
  brokenImagesPage: BrokenImagesPage;
  loginFormPage: LabFormPage<keyof typeof LOGIN.fields>;
  contactFormPage: LabFormPage<keyof typeof CONTACT.fields>;
  addressFormPage: LabFormPage<keyof typeof ADDRESS.fields>;
  paymentFormPage: LabFormPage<keyof typeof PAYMENT.fields>;
  checkoutFormPage: LabFormPage<keyof typeof CHECKOUT.fields>;
  profileFormPage: LabFormPage<keyof typeof PROFILE.fields>;
  multiStepFormPage: MultiStepFormPage;
  validationErrorsPage: ValidationErrorsPage;
  otpLoginPage: OtpLoginPage;
  pdfDownloadPage: PdfDownloadPage;
  generateTextFilePage: GenerateTextFilePage;
}

export const test = core.extend<QaPracticePages>({
  buttonsPage: async ({ page }, use) => use(new ButtonsPage(page)),
  inputsPage: async ({ page }, use) => use(new InputsPage(page)),
  nativeSelectPage: async ({ page }, use) => use(new NativeSelectPage(page)),
  searchableSelectPage: async ({ page }, use) => use(new SearchableSelectPage(page)),
  modalsPage: async ({ page }, use) => use(new ModalsPage(page)),
  checkboxPage: async ({ page }, use) => use(new CheckboxPage(page)),
  radioPage: async ({ page }, use) => use(new RadioPage(page)),
  multiSelectPage: async ({ page }, use) => use(new MultiSelectPage(page)),
  tabsPage: async ({ page }, use) => use(new TabsPage(page)),
  accordionsPage: async ({ page }, use) => use(new AccordionsPage(page)),
  doubleClickPage: async ({ page }, use) => use(new DoubleClickPage(page)),
  rightClickPage: async ({ page }, use) => use(new RightClickPage(page)),
  staticTablePage: async ({ page }, use) => use(new StaticTablePage(page)),
  paginationPage: async ({ page }, use) => use(new PaginationPage(page)),
  javaScriptAlertsPage: async ({ page }, use) => use(new JavaScriptAlertsPage(page)),
  bugPlaygroundPage: async ({ page }, use) => use(new BugPlaygroundPage(page)),
  keyboardKeysPage: async ({ page }, use) => use(new KeyboardKeysPage(page)),
  sliderPage: async ({ page }, use) => use(new SliderPage(page)),
  dragDropPage: async ({ page }, use) => use(new DragDropPage(page)),
  dynamicTablePage: async ({ page }, use) => use(new DynamicTablePage(page)),
  notificationsPage: async ({ page }, use) => use(new NotificationsPage(page)),
  formRegisterPage: async ({ page }, use) => use(new FormRegisterPage(page)),
  fileUploadPage: async ({ page }, use) => use(new FileUploadPage(page)),
  fileDownloadPage: async ({ page }, use) => use(new FileDownloadPage(page)),
  iframesPage: async ({ page }, use) => use(new IframesPage(page)),
  dateRangePage: async ({ page }, use) => use(new DateRangePage(page)),
  alertsPage: async ({ page }, use) => use(new AlertsPage(page)),
  toastsPage: async ({ page }, use) => use(new ToastsPage(page)),
  loaderPage: async ({ page }, use) => use(new LoaderPage(page)),
  lazyLoadPage: async ({ page }, use) => use(new LazyLoadPage(page)),
  infiniteScrollPage: async ({ page }, use) => use(new InfiniteScrollPage(page)),
  tablesPage: async ({ page }, use) => use(new DynamicTablePage(page, DynamicTablePage.tablesRoute)),
  newTabPage: async ({ page }, use) => use(new NewTabPage(page)),
  shadowDomPage: async ({ page }, use) => use(new ShadowDomPage(page)),
  datePickerPage: async ({ page }, use) => use(new DatePickerPage(page)),
  brokenImagesPage: async ({ page }, use) => use(new BrokenImagesPage(page)),
  loginFormPage: async ({ page }, use) => use(new LabFormPage(page, LOGIN)),
  contactFormPage: async ({ page }, use) => use(new LabFormPage(page, CONTACT)),
  addressFormPage: async ({ page }, use) => use(new LabFormPage(page, ADDRESS)),
  paymentFormPage: async ({ page }, use) => use(new LabFormPage(page, PAYMENT)),
  checkoutFormPage: async ({ page }, use) => use(new LabFormPage(page, CHECKOUT)),
  profileFormPage: async ({ page }, use) => use(new LabFormPage(page, PROFILE)),
  multiStepFormPage: async ({ page }, use) => use(new MultiStepFormPage(page)),
  validationErrorsPage: async ({ page }, use) => use(new ValidationErrorsPage(page)),
  otpLoginPage: async ({ page }, use) => use(new OtpLoginPage(page)),
  pdfDownloadPage: async ({ page }, use) => use(new PdfDownloadPage(page)),
  generateTextFilePage: async ({ page }, use) => use(new GenerateTextFilePage(page)),
});

export { expect, tc, bug } from '../../core/fixtures';
