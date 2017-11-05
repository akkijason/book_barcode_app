using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Net;
using System.Collections.Specialized;
using System.Xml;

public partial class AjaxCaller : System.Web.UI.Page
{
    protected void Page_Load(object sender, EventArgs e)
    {

    }

    protected String PostRequest(String url, String isbn)
    {
        String serviceUrl = String.Empty;
        serviceUrl = url + isbn;
        String result = String.Empty;

        using (WebClient client = new WebClient())
        {
            byte[] response = client.UploadValues(url, new NameValueCollection() {
                {"isbn",isbn }
            });

            result = System.Text.Encoding.UTF8.GetString(response);
        }

        return result;
    }

    [System.Web.Services.WebMethod]
    public static String GetRequest(String url, String isbn)
    {
        String serviceUrl = String.Empty;
        serviceUrl = url + isbn;
        String xmlresult = String.Empty;
        String result = String.Empty;

        using (WebClient client = new WebClient())
        {
            byte[] response = client.DownloadData(serviceUrl);
            xmlresult = System.Text.Encoding.UTF8.GetString(response);
            try
            {
                XmlDocument xmlDoc = new XmlDocument();
                xmlDoc.LoadXml(xmlresult);
                XmlNodeList xnList = xmlDoc.SelectNodes("//ISBNdb/BookList/BookData"); //Another way---- XmlNodeList xnList = xmlDoc.GetElementsByTagName("BookData");
                foreach (XmlNode xn in xnList)
                {

                    result = xn["Title"].InnerText + ":" + xn["AuthorsText"].InnerText + ":" + xn.Attributes["isbn"].Value;
                }
            }
            catch (Exception e) { }

        }
        return result;
    }
}