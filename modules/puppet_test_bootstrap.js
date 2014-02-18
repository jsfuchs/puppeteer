/* Copyright 2013 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *     You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *     See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Author: joonlee@google.com (Joon Lee)
 */

// Puppet tests infer the Puppet directory URL from the source of script
// elements on the page. For a unit test, we need to provide it explicitly.
var testUrl = window.location.href;
var puppetDirIndex = testUrl.lastIndexOf('/', testUrl.lastIndexOf('/') - 1);
window['PUPPET_DIRECTORY_URL'] = testUrl.substring(0, puppetDirIndex + 1);
