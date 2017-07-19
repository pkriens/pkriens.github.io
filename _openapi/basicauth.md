# Basic Auth Example
 
This example demonstrates the use of the [HTTP Basic Authentication][1] in the OpenAPI suite. It creates a REST endpoint at `/openapi/security/basic` with two operations:
 
* `/authenticated/{action}` – Verify if the action is authorized while requiring authentication. The return is a `boolean`.
* `/unauthenticated/{action}` –  Verify if the action is authorized while not requiring authentication. The return is a `boolean`.
 
## OpenAPI Source
 
The OpenAPI source is listed in this directory as `openapi.json`. It is annotated here:
 
     {
        "swagger": "2.0",
        "basePath": "/openapi/security/basic",
 
The `securityDefinition` defines the definitions of a security _scheme_ and names it. A scheme definition defines a, which is `basic`, `oauth2`, or `apikey`. It also defines the parameters of the scheme type. The name of the definition can then be used in `security` sections.
 
In this case we define a security scheme with the name `basicauth` of type `basic`. This the well supported, very popular, but not very secure [Basic Authentication][1] scheme.
 
        "securityDefinitions": {
            "basicauth": {
                "type": "basic"
            }
        },
 
On the top level we can set the default security scheme. The default scheme is used when an operation has no `security` section.  Since we've defined the `basicauth` scheme we can now refer to it here. The value of the field is an empty array. These are the parameters to the scheme. However, Basic Authentication does not have any parameters.
 
        "security": [ {
            "basicauth": []
        } ],
 
And then the operations. The `authenticated` operation has no `security` section so it uses the default security scheme set of type `basic` with the name `basicauth`.
 
        "paths": {
            "/authenticated/{action}": {
                "get": {
                    "operationId": "authenticated",
                    "parameters": [{
                            "name"      : "action",
                            "in"        : "path",
                            "required"  : true,
                            "type"      : "string"
                    }],
                    "responses": {
                        "200": {
                            "schema": {
                                "type": "boolean"
                            }
                        }
                    }
                }
            },
 
The `unauthenticated` operation has an actual empty `security` (list with no elements) section so it has **no** authentication. That is, the OpenAPI runtime can call that method without requiring authentication. Such methods are necessary to login.
 
            "/unauthenticated": {
                "get": {
                    "operationId": "unauthenticated",
                    "security": [],
                    "parameters": [ {
                            "name"      : "action",
                            "in"        : "path",
                            "required"  : true,
                            "type"      : "string"
                    }],
                    "responses": {
                        "200": {
                            "schema": {
                                "type": "boolean"
                            }
                        }
                    }
                }
            }
 
## Java Source
 
After we run `../gradlew opeanpi` in this project directory we create the sources in the `gen-src` directory. The parameters for this generation are enumerated in the `build.gradle` file.
 
In the source directory we extend the `BasicAuthBase` class that was generated and implement the required methods:
 
    @ProvideBasicAuthBase
    @Component(service=OpenAPIBase.class)
    public class BasicAuthExample extends BasicAuthBase {
        @Override
        protected boolean authenticated(String action) throws Exception {
            System.out.println("Authenticated " + action);
            return false;
        }
        @Override
        protected void unauthenticated() throws Exception {
            System.out.println("Unauthenticated " + action);
            return false;
        }
    }
 
The bundle we create, `biz.aQute.openapi.basicauth.example`, contains the implementation as well as the generated code. The bnd file looks as follows:
 
    Bundle-Description: \
        An OpenAPI example for using basic authentication and the \
        setting up the authorization.
 
    Private-Package: \
        biz.aQute.openapi.basicauth.example
 
    -buildpath: \
        biz.aQute.openapi.provider, \
        osgi.enroute.base.api
 
    # needed to tell bnd that we have generated sources
    src = src, gen-src
 
## Running the Code
 
We create a `basicauth.bndrun` file to specify the run environment. This requires the following initial bundles:
 
* `biz.aQute.openapi.basicauth.example` – The example project
* `biz.aQute.openapi.security.useradmin.provider` – OpenAPI security (actually authenticators) need a persistent storage to store credentials and other user information. The OpenAPI provides a full suite of OpenAPI authenticators based on the OSGi User Admin specification.
* `org.apache.felix.webconsole.plugins.useradmin)` – Allows us to use the Apache Felix Webconsole to edit and view the User Admin setup
* `org.apache.felix.gogo.command,osgi.enroute.gogo.shell.provider` – Gogo because all OpenAPI suite bundles have Gogo commands to manipulate the environment.
 
We then resolve and run debug the `basicauth.bndrun` file. This will start a web server and a gogo shell.
 
We can now test the code by going to [http://localhost:8080/openapi/security/basic/unauthenticated/foo], assuming a default setup. If we access that URL we should see `false` being returned.
 
## Setting up a User
 
This example uses basic authentication based on the OSGi User Admin service. This means we need to create a user in User Admin and then associate a login id and password with that user.
 
There is a convenience command in the Basic Authentication Security provider for User Admin to list, set, reset passwords.
 
    G! basicauth -u u123456 john.doe@example.com secret
    john.doe@example.com
    G!
 
A few notes. In general it is better to separate the id used for logging in from the user name. This is model is supported, it gives problems when users want to change their ids. A very good practice in our industry is to always make the actualy user name in User Admin an opaque identity that has no meaning. The properties can then be used to set the user's profile information. In this case we use the email address of the user for the login id but have given the user a unique number as name in User Admin. It also allows you to use different and multiple ids. For example, API keys can easily be implemented this way.
 
Also, and for some more important, users and groups share the same name namespace. For this reason a user should not be capable of picking a name that could be confused with a group. Especially since group names are used for authorization checks as we will see later. Ergo, don't let the user pick the name for the User Admin user name.
 
## Authenticating
 
We can now access the server on the authenticated URI: [http://localhost:8080/openapi/security/basic/authenticated/foo]. If we access that URL we receive a 401 result which initiates a popup on most browsers to enter the user's credentials. In this case, we enter john's credentials:
 
    id: john.doe@example.com
    pw: secret
 
Strangely, this does not login, it keeps asking for authenticating. You could now spend 15 attempts (or you already did that, I did) but that is not going to improve the situation. Therefore, after all else fails, read the log. There you will see this warning:
 
    WARN    biz.aQute.openapi.ua.basic :: Attempt to authenticate with basic
            auth over an unencrypted line. If this is necessary, configure
            PID 'biz.aQute.openapi.ua.basic.requireEncrypted'
 
It is a bit annoying for developers but HTPP is not by default enabled. Since Basic Authentication sends passwords more or less in the clear encryption is kind of relevant. Since it is not handy to run https in a development environment, we can override this setting with configuration. Therefore, create a factory configuration for `biz.aQute.openapi.ua.basic` and set the `requireEncrypted` to `false`. Clearly, this is easiest done in the Apache Felix Web Console.
 
If you now try to login again with the same credentials then you should see:
 
    Authenticated: foo
 
Clearly, the request has been authenticated.
 
## Permissions
 
The next step is to _authorize_ the request. The OpenAPI suite uses the [OSGi enRoute Authority][2] to authorize requests. In this example we use an Authority implementation that is fully based on User Admin but there also exists an Authority implementation based on Apache Shiro. The `Authoriy` interface's methods `hasPermission` and `checkPermission` are also added to the `OpenAPIBase` class so implementation code can directly call `hasPermission` and `getPermission` on `this`.
 
A permission is in the end a structured string. The syntax is borrowed from Apache Shiro. It basically consists of _parts_ separated with colons (':'). A part can be a wildcard, a literal match or a number of alternative literal matches. For example:
 
    read:device:n5629238
    read:user:basic,friends,password:u123456
    read:user:*:*
 
We can thus now change our code to check if we're authorized for the given action.
 
        @Override
        protected boolean authenticated(String action) throws Exception {
            System.out.println("Authenticated " + action);
            return hasPermission(action);
        }
 
When we try this with the [http://localhost:8080/openapi/security/basic/authenticated/foo] URI then we get a false back. I guess this is more or less expected.
 
## Authorizing a User
 
To authorize John Doe (our current user) we need to set the permissions of the `u123456` user. In User Admin there is the concept of the `Authorization` object. You can get this object for each user. It is associated with all _implied_ roles of the user. The meaning of _implies_ can be quite simple and rather complex. In the simple form, groups hold _basic members_. A group implies its basic members and their basic members (for the groups in there) recursively. Group names are the operators here. A group name is the earlier defined _permission_. Each permission has therefore a set of users or implied permissions. Confused? Let's try a few examples.
 
So far we tested if the `foo` action was authorized. To create a `foo` permission we can create a group with the name `foo`. The Gogo command `usermod` makes that quite easy to do:
 
    G! usermod u123456 foo
    usermod u123456 foo
    User               u123456
    In groups          [foo]
    Authorized         [u123456, foo]
    Properties         {aQute.ua.id=john.doe@example.com}
    Credentials        [aQute.ua.pw, aQute.ua.pw.salt]
    G!
 
If we now attempt to access the URL we see that we do have permission for `foo`.
 
To make it slightly more complicated we could add an action `view:a`, `view:b` and `view:c`. We then give John Doe permission to see `view:a,c`.
 
    G! usermod u123456 view:a,c
    User               u123456
    In groups          [foo, view:a,c]
    Authorized         [u123456, foo, view:a,c]
    Properties         {aQute.ua.id=john.doe@example.com}
    Credentials        [aQute.ua.pw, aQute.ua.pw.salt]
 
You can now try out the following URLs:
 
     [http://localhost:8080/openapi/security/basic/authenticated/view:a] true
     [http://localhost:8080/openapi/security/basic/authenticated/view:b] false
     [http://localhost:8080/openapi/security/basic/authenticated/view:c] true
 
 
## Roles
 
In the previous example we directly added the user to the permission groups. Clearly, that does not scale well. Normally, the idea is to use _roles_ and assign a role to a user. The actual permissions are then associated with a role. For example, assume we have the following roles:
 
* Admin
* User
* Installer
 
Assume also we have the following permission grammar:
 
    permission ::=  verb ':' type ':' instance
    verb       ::= 'create' | 'read' | 'update' | 'delete'
    type       ::= 'user' | 'device' | 'route' | 'channel'
    instance   ::= <some name>
 
We first give the Admin role permission to do anything:
 
    G! groupadd Admin *:*:*
    Group              Admin
    In groups          [*:*:*]
    Basic Members      []
    Requried Members   []
    Properties         {}
    Credentials        []
 
We then give the user the permission to read all state except for the `user` types:
 
    G! groupadd User read:device,route,channel:*
 
The `Installer` role can create update everything except the `user` type.
 
    G! groupadd Installer *:device,route,channel:*
 
Lets give John Doe the User role. We can use the `-r` option to not just add the given group but replace all groups for that user:
 
    G! usermod -r u123456 User
 
We can now test the roles directly from the shell:
 
    G! implies u123456 read:device:d54123
    true
    G! implies u123456 create:device:d54123
    false
 
So lets see what happens when John Doe is promoted to an installer:
 
    G! usermod --replace u123456 Installer
    User               u123456
    In groups          [Installer]
    Authorized         [*:device,route,channel:*, Installer, u123456]
    Properties         {aQute.ua.id=john.doe@example.com}
    Credentials        [aQute.ua.pw, aQute.ua.pw.salt]
    G! implies u123456 create:device:45678
    true
    G! implies u123456 create:user:u653229
    false
 
Clearly when we make John an Admin then he has no more restrictions:
 
    G! usermod --replace u123456 Admin
    User               u123456
    In groups          [Admin]
    Authorized         [*:*:*, u123456, Admin]
    Properties         {aQute.ua.id=john.doe@example.com}
    Credentials        [aQute.ua.pw, aQute.ua.pw.salt]
    G! implies u123456 create:user:u653229
    true
    G! implies u123456 what:ever:isneeded
    true
 
In this model we do not allow a User role to see any user information. However, often you need to be able to see and update your own information. This can be managed with the following:
 
    G! usermod -r u123456 User read,update:user:u123456
    ...
    G! implies u123456 read:user:u123456
    true
    G! implies u123456 read:user:uXXXXXX
    false
 
 
## Advanced
 
Constructing this string with dynamic arguments requires escaping. To make this easier, the `hasPermission` and `checkPermission` calls take  varargs for the dynamic parts.
 
    hasPermission( "read:user", user.getName() );
 
This will automatically escape any characters that are part of the syntax. Since the comma (','), colon (':'), and wildcard ('*') characters have special meaning, they need to be escaped with a backslash in a part when they should be literally matched.
 
The grammar of the permission string is:
 
    permission ::= part ( ':' part )*
    part       ::= '*' | literal ( ',' literal )*
    literal    ::= ( unescaped | escaped ) +
    escaped    ::= '\' [:*,\]
    unescaped  ::= [^:*,\]
 
 
 
[1]: https://tools.ietf.org/html/rfc7617
[2]: https://github.com/osgi/osgi.enroute/blob/master/osgi.enroute.base.api/src/osgi/enroute/authorization/api/Authority.java
