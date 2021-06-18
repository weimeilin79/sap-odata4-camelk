// camel-k: language=java dependency=camel-openapi-java open-api=ibm-sap.yaml dependency=camel-jacksonxml dependency=camel-jackson

import org.apache.camel.builder.RouteBuilder;

import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;

public class SapOdata extends RouteBuilder {

  ArrayList<String> allSOs = new ArrayList<String>();
  String tempSO = "";
  String tempPO = "";
  String tempCust = "";
  String tempCustID = "";

  @Override
  public void configure() throws Exception {

    from("direct:fetch")
      .log("------FETCH ${header.SalesOrderID}------")
      .setBody().simple("${null}")
      .removeHeaders("CamelHttp*")
      .bean(this, "reset()")
      .multicast().to("direct:getSO","direct:getItems").end()
      .bean(this, "getTempCustID()")
      .setHeader("CustomerID").simple("${body}")
      .log("------FETCH CustomerID ${headers.CustomerID}------")
      .setBody().simple("${null}")
      .to("direct:getCustomer")
      
      .bean(this, "getTxt()")
      .log("${body}")
    ;


   

    from("direct:fetchall")
      .bean(this, "resetAllSO()")
      .setHeader("Authorization").constant("Basic XXX")
      .setHeader("Accept").constant("application/json")
      .setBody().simple("${null}")
      .removeHeaders("CamelHttp*")
      .log("------FETCH ALL------ ${headers}")
      .to("https://sapes5.sapdevcenter.com/sap/opu/odata/iwbep/GWSAMPLE_BASIC/SalesOrderSet?$orderby=ChangedAt desc&$top=10&bridgeEndpoint=true")
      .unmarshal().json()
      //.log("result--------> ${body[d][results]}")
        .split().simple("${body[d][results]}")
          .setHeader("SalesOrderID").simple("${body[SalesOrderID]}")
          .setHeader("CustomerID").simple("${body[CustomerID]}")
          .log("SalesOrderID--------> ${headers.SalesOrderID}")
          .log("CustomerID--------> ${headers.CustomerID}")
          .setBody().simple("${null}")
          .to("direct:fetch")
          .bean(this, "addToAllSO(${body})")
          .setBody().simple("${null}")
        .end()
        //
        .bean(this, "getAllSO()")
        .log("EVERYTHING--------> ${body}")
      
  ;

  from("direct:getSO")
    .setHeader("Authorization").constant("Basic XXX")
    .setHeader("Accept").constant("application/json")
    .toD("https://sapes5.sapdevcenter.com/sap/opu/odata/iwbep/GWSAMPLE_BASIC/SalesOrderSet('${header.SalesOrderID}')?bridgeEndpoint=true")
    .unmarshal().json()
    .setHeader("CustomerID").simple("${body[d][CustomerID]}")
    .marshal().json()
    .log("SO---- ${body}")
    .log("CustomerID---- ${header.CustomerID}")
    .bean(this, "setSO(\"${body}\",\"${headers.CustomerID}\")")
 ;
 

  from("direct:getItems")
      //.removeHeaders("*")
      //.setBody().constant("")
      .setHeader("Authorization").constant("Basic XXX")
      .setHeader("Accept").constant("application/json")
      .toD("https://sapes5.sapdevcenter.com/sap/opu/odata/iwbep/GWSAMPLE_BASIC/SalesOrderSet('${header.SalesOrderID}')/ToLineItems?bridgeEndpoint=true")
      .unmarshal().json()
      .marshal().json()
      .log("PO---- ${body}")
      .bean(this, "setPO(\"${body}\")")
  ;


  

  from("direct:getCustomer")
      .setHeader("Authorization").constant("Basic XXX")
      .setHeader("Accept").constant("application/json")
      .toD("https://sapes5.sapdevcenter.com/sap/opu/odata/iwbep/GWSAMPLE_BASIC/BusinessPartnerSet('${header.CustomerID}')?bridgeEndpoint=true")
      
      .unmarshal().json()
      .marshal().json()
      .log("CUST---- ${body}")
      .bean(this, "setCust(\"${body}\")")
  ;
  


//ODATA v4 NOT SUPPORTED via SAP???
  /*
  from("timer:foo?delay=1s&repeatCount=1")
   // .unmarshal().json()
    .setHeader("CamelOlingo4.keyPredicate", constant("'0500000000'"))
    .setHeader("CamelOlingo4.$expand").constant("_Item")
    .to("olingo4://read/SalesOrder")
    .setBody().simple("${body.properties}")
    .bean(this, "aggregate(\"SO\",'${body}')")
    .setBody(method(this, "getSalesOrder()"))
    .marshal().json()
    .log("${body}")
  ;
*/

  }

  

  public void resetAllSO(){
    allSOs = new ArrayList<String>();
  }

  public void addToAllSO(String input){
    allSOs.add(input);
  }

  public String getAllSO(){
    String output = "[";
    for (String so : allSOs ) {
      output+=so+",";
    }

    output = output.substring(0, output.length()-1);
    return output+"]";
  }

  public void reset() {
    tempPO = "";
    tempSO = "";
  }

  public String getTempCustID(){
    return tempCustID;
  }
  public void setPO(String input) {
    tempPO = "\"PO\":"+input;
    
    
  }

  public void setCust(String input) {
    tempCust = "\"COSTOMER\":"+input;
    
  }

  public void setSO(String input, String custid) {
    tempSO = "\"SO\":"+input;
    tempCustID = custid;
  }

  public String getTxt() {
    return "{"+tempSO+","+tempPO+","+tempCust+"}";
  }
}
