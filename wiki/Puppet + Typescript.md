# Puppet + Typescript #

Typescript support has now been added to puppet tests. This has 2 large implications:

##  1. Strongly Typed Tests  ##
 All exports from puppet.js have been strongly typed in the corresponding .d.ts file. In order to make use of strong typing, please include
    
    /// reference <"path/to/puppet">
    
 At the top of any puppet tests written in typescript. You should now see proper type assertions when compiling any typescript puppet tests.
 
##  2. AMD Support ##
 This feature actually extends beyond typescript, but its implementation was motivated by module loading (which typescript supports, using requireJS, systemJS, or CommonJS). The main issue was that
 puppet tests were executing before any asynchronous modules were imported. The solution was to add the data-deferred="true" attribute to the puppet script tag, and then later manually resume testing via puppet.beginDeferredExecution().
 You can see this in action in the typescript sample.