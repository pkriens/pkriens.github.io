 sig Module {
      requires            : set Module,
      static              : set Module,
      transitive          : set Module,
      unqualifiedExports  : set Package,
      qualifiedExports    : Package -> set Module,
      content             : set Package,
      dependences         : set Module
 } {
  
			transitive + static in requires
      
			// The requires keyword may be followed by the modifier 
			// transitive. This causes any module which depends on 
			// the current module to have an implicitly declared 
			// dependence on the module specified by the requires 
			// transitive statement. (the @ is for Alloy to know
			// it should not prefix dependences with 'this.')

			dependences = requires + transitive.@dependences


			// It is a compile-time error if the declaration of 
			// a module expresses a dependence on itself, either 
			// directly or indirectly.

			this not in dependences

		  // It is a compile-time error if the package specified by exports 
		  // is not declared by a compilation unit associated with the current 
		  // module. (`qualifiedExports.Module` works like `Map.keySet()`)
      
  	  unqualifiedExports + qualifiedExports.Module in content

			// It is a compile-time error if more than one exports statement 
			// in a module declaration specifies the same package name. ( the &
			// is the subset operator.)

			no unqualifiedExports & qualifiedExports.Module

      // If the declaration of a module does not express a 
		  // dependence on the java.base module, and the module is 
		  // not itself java.base, then the module has an implicitly 
		  // declared dependence on the java.base module.

			JavaBaseModule not in requires implies this = JavaBaseModule 

			// It is a compile-time error if the named module [in requires] is not 
			// observable.
    
			requires in Observable.scope


			// It is permitted for the to clause of an exports 
			// or opens statement to specify a module which is 
			// not observable.
			//
			// not testable and the compiler gives an error
			// when the 'to' does not exist


}

one sig JavaBaseModule extends Module {} {
    
      // A requires statement must not appear in the declaration 
      // of the java.base module, or a compile-time error occurs, 
      // because it is the primordial module and has no dependences. 
    
      no dependences
}

sig Package {
      references          : set Package
}

one sig Observable {
		scope : set Module
} {
	JavaBaseModule in scope
}

pred isStaticAccessible( m : Module, p : Package ) {

			// Code inside the module may access public and 
			// protected types of all packages in the module.

			p in m.content						

	
			// For a qualified statement, the 
			// public and protected types in the package, and their 
			// public and protected members, are accessible solely 
			// to code in the modules specified in the to clause. 

	or  p in m.dependences.qualifiedExports.m

 			// For an unqualified statement, these types and 
			// their members are accessible to code in any module. 

	or	p in m.dependences.unqualifiedExports

}

run isStaticAccessible  for 4
