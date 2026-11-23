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
});

export { expect, tc, bug } from '../../core/fixtures';
